# FAIRNESS FOR 2 GROUPS
# ----------------
# We enforce a fairness constraint on the set of epsilon staircases.
# Let:
#   total_red_eps  = number of red nodes participating in staircases
#   total_blue_eps = number of blue nodes participating in staircases

import json
import os
import glob
from itertools import combinations

#path to the graphs
INPUT_DIR = "data/rome-lib/group_2"
TARGET_GRAPH = "*"

LAMBDA_1 = 2.0
MODEL_VARIANTS = [
    {"label": "no_fairness", "lambda_2": 0.0, "suffix": "_fairness_l2_0.lp"},
    {"label": "with_fairness", "lambda_2": 0.5, "suffix": "_fairness_l2_05.lp"},
]

def load_graph(path):
    with open(path, "r") as f:
        return json.load(f)

def node_color_map(graph):
    return {str(n["id"]): n.get("color", "unknown").lower() for n in graph["nodes"]}

def get_incident_edges(graph, node_id):
    nid = str(node_id)
    return [e for e in graph["links"] 
            if str(e["source"]) == nid or str(e["target"]) == nid]

def get_other_end(edge, center_id):
    if str(edge["source"]) == str(center_id):
        return str(edge["target"])
    return str(edge["source"])

def count_colors(graph):
    red = 0
    blue = 0
    for node in graph["nodes"]:
        color = node.get("color", "unknown").lower()
        if color == "red":
            red += 1
        elif color == "blue":
            blue += 1
    return red, blue

# =========================
# LP BUILDER
# =========================

class FairnessBiofabricLP:
    def __init__(self, graph, lambda_2):
        self.graph = graph
        self.nodes = graph["nodes"]
        self.edges = graph["links"]
        self.color = node_color_map(graph)
        self.lambda_2 = float(lambda_2)
        self.M = len(self.edges) + 1
        
        self.constraints = []
        self.bounds = []
        self.binary_vars = set()
        self.general_vars = set()
        self.c_vars = set()
        self.fairness_terms = []
        self.compute_fairness = True
        
    def add_constraint(self, c):
        self.constraints.append(c)
    
    def add_bound(self, b):
        self.bounds.append(b)
    
    def get_x(self, a, b):
        if a == b:
            return "0"
        var = f"x_e{a}_e{b}"
        self.binary_vars.add(var)
        return var
    
    def get_y(self, a, b):
        if a == b:
            return "0"
        var = f"y_{a}_{b}"
        self.binary_vars.add(var)
        return var
    
    def get_z(self, a, b):
        if a == b:
            return "0"
        # z represents unordered edge adjacency; canonicalize pair order.
        a_s, b_s = str(a), str(b)
        try:
            a_n, b_n = int(a_s), int(b_s)
            if a_n > b_n:
                a_s, b_s = b_s, a_s
        except ValueError:
            if a_s > b_s:
                a_s, b_s = b_s, a_s
        var = f"z_e{a_s}_e{b_s}"
        self.binary_vars.add(var)
        return var
    
    def get_c(self, center, e1, e2, e3):
        var = f"c_n{center}_e{e1}_{e2}_{e3}"
        self.binary_vars.add(var)
        self.c_vars.add(var)
        return var
    
    def get_pos(self, e):
        var = f"pos_e{e}"
        self.general_vars.add(var)
        return var
    
    def build(self):
        edge_ids = [str(e["id"]) for e in self.edges]
        node_ids = [str(n["id"]) for n in self.nodes]

        # Antisymmetry: for every pair exactly one direction is true.
        for a, b in combinations(edge_ids, 2):
            self.add_constraint(f"{self.get_x(a,b)} + {self.get_x(b,a)} = 1")
        for a, b in combinations(node_ids, 2):
            self.add_constraint(f"{self.get_y(a,b)} + {self.get_y(b,a)} = 1")
        
        # Edge transitivity
        for a, b, c in combinations(edge_ids, 3):
            self.add_constraint(f"{self.get_x(a,b)} + {self.get_x(b,c)} - {self.get_x(a,c)} <= 1")
            self.add_constraint(f"{self.get_x(a,b)} + {self.get_x(b,c)} - {self.get_x(a,c)} >= 0")
        
        # Node transitivity
        for a, b, c in combinations(node_ids, 3):
            self.add_constraint(f"{self.get_y(a,b)} + {self.get_y(b,c)} - {self.get_y(a,c)} <= 1")
            self.add_constraint(f"{self.get_y(a,b)} + {self.get_y(b,c)} - {self.get_y(a,c)} >= 0")
        
        # Position constraints
        for alpha in edge_ids:
            terms = [self.get_x(beta, alpha) for beta in edge_ids if beta != alpha]
            if terms:
                self.add_constraint(f"{self.get_pos(alpha)} - {' - '.join(terms)} = 0")
            else:
                self.add_constraint(f"{self.get_pos(alpha)} = 0")
            self.add_bound(f"0 <= {self.get_pos(alpha)} <= {len(edge_ids)-1}")
        
        # Consecutiveness
        z_vars = []
        for a, b in combinations(edge_ids, 2):
            z = self.get_z(a, b)
            z_vars.append(z)
            pa = self.get_pos(a)
            pb = self.get_pos(b)
            # If z_ea_eb = 1 then |pos_ea - pos_eb| <= 1 (and with distinct positions this means adjacency).
            # Keep constants on RHS to avoid LP parser creating numeric fake variables.
            self.add_constraint(f"{pa} - {pb} + {self.M} {z} <= {self.M + 1}")
            self.add_constraint(f"{pb} - {pa} + {self.M} {z} <= {self.M + 1}")
        # In a linear order of m edges there are exactly m-1 adjacent unordered pairs.
        if z_vars:
            self.add_constraint(f"{' + '.join(z_vars)} = {len(edge_ids) - 1}")
        
        # Staircases
        for center in self.nodes:
            cid = str(center["id"])
            incident = get_incident_edges(self.graph, cid)
            if len(incident) < 3:
                continue
            
            # We examine every triplet of edges sharing this center
            for e1, e2, e3 in combinations(incident, 3):
                # Identify the 'other' nodes these edges connect to
                a = get_other_end(e1, cid)
                b = get_other_end(e2, cid)
                c_val = get_other_end(e3, cid)
                
                # A staircase must connect to 3 distinct neighbor nodes
                if len({a, b, c_val}) < 3:
                    continue
                
                c_var = self.get_c(cid, e1["id"], e2["id"], e3["id"])
                z12 = self.get_z(e1["id"], e2["id"])
                z23 = self.get_z(e2["id"], e3["id"])
                
                # 1. NODE ORDER VARIABLES
                y_ab = self.get_y(a, b)
                y_bc = self.get_y(b, c_val)

                # 2. THE HONESTY & MONOTONICITY CONSTRAINT:
                # A staircase is active (c_var=1) ONLY IF edges are consecutive (z12, z23)
                # AND the nodes are monotonic (a < b < c OR a > b > c).
                # Logic: If z12=1 and z23=1 and y_ab == y_bc, then c_var must be 1.
                # If they are NOT monotonic (y_ab != y_bc), c_var MUST be 0.
                
                # c_var can only be 1 if node order is consistent (both 1 or both 0)
                # Constraint: c_var <= 1 - (y_ab - y_bc) and c_var <= 1 - (y_bc - y_ab)
                self.add_constraint(f"{c_var} - {y_ab} + {y_bc} <= 1")
                self.add_constraint(f"{c_var} + {y_ab} - {y_bc} <= 1")

                # 3. LINKING C to Z (Standard Adjacency):
                # If c_var is 1, edges must be consecutive.
                self.add_constraint(f"{c_var} - {z12} <= 0")
                self.add_constraint(f"{c_var} - {z23} <= 0")
                
                # Force c_var to 1 if z12=1, z23=1 and order is monotonic
                # (z12 + z23 + (match)) - c_var <= 2
                # We use an auxiliary logic: if y_ab + y_bc is 0 or 2, they match.
                self.add_constraint(f"{z12} + {z23} + {y_ab} + {y_bc} - {c_var} <= 3") # Case: a<b<c
                self.add_constraint(f"{z12} + {z23} - {y_ab} - {y_bc} - {c_var} <= -1") # Case: a>b>c

                # 4. FAIRNESS WEIGHTING (Center 3x, Neighbors 1x)
                red_count = 0
                blue_count = 0
                
                if self.color[cid] == "red":
                    red_count += 3
                elif self.color[cid] == "blue":
                    blue_count += 3
                    
                for neighbor in [a, b, c_val]:
                    if self.color[neighbor] == "red":
                        red_count += 1
                    elif self.color[neighbor] == "blue":
                        blue_count += 1
                
                self.fairness_terms.append((c_var, red_count, blue_count))
                
        # FAIRNESS
        if self.compute_fairness and self.fairness_terms:
            self.general_vars.update([
                "total_red_eps",
                "total_blue_eps",
                "imbalance",
                "total_eps"
            ])
            
            self.add_bound("total_red_eps >= 0")
            self.add_bound("total_blue_eps >= 0")
            self.add_bound("imbalance >= 0")
            self.add_bound("total_eps >= 0")
            
            red_terms = [f"{r} {var}" for var,r,b in self.fairness_terms]
            blue_terms = [f"{b} {var}" for var,r,b in self.fairness_terms]
            
            self.add_constraint(f"total_red_eps - {' - '.join(red_terms)} = 0")
            self.add_constraint(f"total_blue_eps - {' - '.join(blue_terms)} = 0")
            self.add_constraint("total_eps - total_red_eps - total_blue_eps = 0")
            
            # self.add_constraint("total_red_eps - 0.4 total_eps >= 0")
            # self.add_constraint("total_red_eps - 0.6 total_eps <= 0")
            
            self.add_constraint("imbalance - total_red_eps + total_blue_eps >= 0")
            self.add_constraint("imbalance - total_blue_eps + total_red_eps >= 0")
    
    def to_lp(self):
        lines = []
        lines.append("Maximize")
        
        obj_terms = [f"{LAMBDA_1} {var}" for var in sorted(self.c_vars)]
        
        if self.compute_fairness:
            if obj_terms:
                obj_line = "  " + " + ".join(obj_terms) + f" - {self.lambda_2} imbalance"
            else:
                obj_line = f"  0 - {self.lambda_2} imbalance"
        else:
            obj_line = "  " + " + ".join(obj_terms) if obj_terms else "  0"
        
        lines.append(obj_line)
        lines.append("")
        lines.append("Subject To")
        
        for c in self.constraints:
            lines.append(f"  {c}")
        
        lines.append("")
        lines.append("Bounds")
        for b in self.bounds:
            lines.append(f"  {b}")
        
        if self.binary_vars:
            lines.append("")
            lines.append("Binary")
            for v in sorted(self.binary_vars):
                lines.append(f"  {v}")
        
        if self.general_vars:
            lines.append("")
            lines.append("General")
            for v in sorted(self.general_vars):
                lines.append(f"  {v}")
        
        lines.append("")
        lines.append("End")
        
        return "\n".join(lines)

# =========================
# MAIN
# =========================

def main():
    files = glob.glob(os.path.join(INPUT_DIR, f"{TARGET_GRAPH}.json"))
    
    if not files:
        print(f"No JSON files found for target: {TARGET_GRAPH}")
        return
    
    for path in sorted(files):
        graph = load_graph(path)
        for variant in MODEL_VARIANTS:
            model = FairnessBiofabricLP(graph, lambda_2=variant["lambda_2"])
            model.build()

            output_path = path.replace(".json", variant["suffix"])
            with open(output_path, "w") as f:
                f.write(model.to_lp())

            print(
                f"Created: {output_path} "
                f"(variant={variant['label']}, lambda_2={variant['lambda_2']})"
            )

if __name__ == "__main__":
    main()

