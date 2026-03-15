import json
import os
import glob
from itertools import combinations

# =========================
# CONFIGURATION
# =========================
INPUT_DIR = "data/rome-lib/group_3"
TARGET_GRAPH = "*" 

LAMBDA_1 = 2.0
MODEL_VARIANTS = [
    {"label": "no_fairness", "lambda_2": 0.0, "suffix": "_fairness_l2_0.lp"},
    {"label": "with_fairness", "lambda_2": 0.5, "suffix": "_fairness_l2_05.lp"},
]
GROUPS = ["red", "blue", "green"]

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

# =========================
# LP BUILDER
# =========================
class FairnessBiofabricLP:
    def __init__(self, graph, lambda_2=0.5):
        self.graph = graph
        self.nodes = graph["nodes"]
        self.edges = graph["links"]
        self.color = node_color_map(graph)
        self.lambda_2 = lambda_2
        self.M = len(self.edges) + 2
        
        self.constraints = []
        self.bounds = []
        self.binary_vars = set()
        self.general_vars = set()
        self.c_vars = set()
        self.z_vars = set()
        self.fairness_terms = []
    
    def add_constraint(self, c): self.constraints.append(c)
    def add_bound(self, b): self.bounds.append(b)
    
    def get_x(self, a, b):
        var = f"x_e{a}_e{b}"
        self.binary_vars.add(var)
        return var
    
    def get_y(self, a, b):
        var = f"y_{a}_{b}"
        self.binary_vars.add(var)
        return var
    
    def get_z(self, a, b):
        var = f"z_e{a}_e{b}"
        self.binary_vars.add(var)
        self.z_vars.add(var)
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
        
        # 1. Position and Transitivity (Standard)
        for a, b, c in combinations(edge_ids, 3):
            self.add_constraint(f"{self.get_x(a,b)} + {self.get_x(b,c)} - {self.get_x(a,c)} <= 1")
            self.add_constraint(f"{self.get_x(a,c)} - {self.get_x(a,b)} - {self.get_x(b,c)} >= -1")
        
        for a, b, c in combinations(node_ids, 3):
            self.add_constraint(f"{self.get_y(a,b)} + {self.get_y(b,c)} - {self.get_y(a,c)} <= 1")
            self.add_constraint(f"{self.get_y(a,c)} - {self.get_y(a,b)} - {self.get_y(b,c)} >= -1")
            
        for alpha in edge_ids:
            terms = [self.get_x(beta, alpha) for beta in edge_ids if beta != alpha]
            self.add_constraint(f"{self.get_pos(alpha)} - {' - '.join(terms)} = 0")
            self.add_bound(f"0 <= {self.get_pos(alpha)} <= {len(edge_ids)-1}")

        # 2. Tight Consecutiveness
        for a, b in combinations(edge_ids, 2):
            z = self.get_z(a, b)
            pa, pb = self.get_pos(a), self.get_pos(b)
            # If z=1, distance is 1
            self.add_constraint(f"{pa} - {pb} + {self.M} {z} <= {self.M + 1}")
            self.add_constraint(f"{pb} - {pa} + {self.M} {z} <= {self.M + 1}")
            # If z=0, distance is >= 2
            self.add_constraint(f"{pa} - {pb} - 2 + {self.M} {z} >= -{self.M}")
            self.add_constraint(f"{pb} - {pa} - 2 + {self.M} {z} >= -{self.M}")

        # 3. Staircases with Monotonicity and 3:1 Weighting
        for center in self.nodes:
            cid = str(center["id"])
            incident = get_incident_edges(self.graph, cid)
            if len(incident) < 3: continue
            
            for e1, e2, e3 in combinations(incident, 3):
                a, b, c_val = [get_other_end(e, cid) for e in [e1, e2, e3]]
                if len({a,b,c_val}) < 3: continue
                
                c_var = self.get_c(cid, e1["id"], e2["id"], e3["id"])
                z12, z23 = self.get_z(e1["id"], e2["id"]), self.get_z(e2["id"], e3["id"])
                y_ab, y_bc = self.get_y(a, b), self.get_y(b, c_val)

                # Monotonicity constraints
                self.add_constraint(f"{c_var} - {y_ab} + {y_bc} <= 1")
                self.add_constraint(f"{c_var} + {y_ab} - {y_bc} <= 1")
                self.add_constraint(f"{c_var} - {z12} <= 0")
                self.add_constraint(f"{c_var} - {z23} <= 0")
                self.add_constraint(f"{z12} + {z23} + {y_ab} + {y_bc} - {c_var} <= 3")
                self.add_constraint(f"{z12} + {z23} - {y_ab} - {y_bc} - {c_var} <= -1")

                # Fairness Weights (Center 3x, Neighbors 1x)
                counts = {g: 0 for g in GROUPS}
                center_color = self.color.get(cid, "unknown")
                if center_color in GROUPS: counts[center_color] += 3
                for n in [a, b, c_val]:
                    col = self.color.get(n, "unknown")
                    if col in GROUPS: counts[col] += 1
                
                self.fairness_terms.append((c_var, counts))

        # 4. Imbalance (Max-Min Difference)
        if self.fairness_terms:
            for g in GROUPS:
                self.general_vars.add(f"total_{g}_eps")
                terms = [f"{c[g]} {v}" for v, c in self.fairness_terms if c[g] > 0]
                if terms:
                    self.add_constraint(f"total_{g}_eps - {' - '.join(terms)} = 0")
                else:
                    self.add_constraint(f"total_{g}_eps = 0")

            self.general_vars.add("imbalance")
            for g1, g2 in combinations(GROUPS, 2):
                self.add_constraint(f"imbalance - total_{g1}_eps + total_{g2}_eps >= 0")
                self.add_constraint(f"imbalance - total_{g2}_eps + total_{g1}_eps >= 0")

    def to_lp(self):
        lines = ["Maximize"]
        obj = [f"{LAMBDA_1} {v}" for v in sorted(self.c_vars)]
        # Objective penalty on Z variables to prevent random packing
        z_penalty = [f"0.01 {v}" for v in sorted(self.z_vars)]
        
        main_obj = " + ".join(obj) if obj else "0"
        penalty = " - " + " - ".join(z_penalty) if z_penalty else ""
        lines.append(f"  {main_obj}{penalty} - {self.lambda_2} imbalance")
        
        lines.append("\nSubject To")
        for c in self.constraints: lines.append(f"  {c}")
        lines.append("\nBounds")
        for b in self.bounds: lines.append(f"  {b}")
        lines.append("\nBinary\n  " + "\n  ".join(sorted(self.binary_vars)))
        lines.append("\nGeneral\n  " + "\n  ".join(sorted(self.general_vars)))
        lines.append("\nEnd")
        return "\n".join(lines)

def main():
    files = glob.glob(os.path.join(INPUT_DIR, f"{TARGET_GRAPH}.json"))
    for path in sorted(files):
        graph = load_graph(path)
        for variant in MODEL_VARIANTS:
            model = FairnessBiofabricLP(graph, lambda_2=variant["lambda_2"])
            model.build()
            out = path.replace(".json", variant["suffix"])
            with open(out, "w") as f: f.write(model.to_lp())
            print(f"Created: {out}")

if __name__ == "__main__":
    main()