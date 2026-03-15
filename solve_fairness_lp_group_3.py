import os
import glob
import subprocess
import json
import time

# =============================================================
# CONFIGURATION
# =============================================================
INPUT_DIR = "data/rome-lib/group_3"
# This pattern finds both the 0 and 0.5 fairness variants
LP_PATTERNS = [
    "*_fairness_l2_0.lp",
    "*_fairness_l2_05.lp",
]

# =============================================================
# GRAPH STATISTICS
# =============================================================
def get_general_stats(graph):
    color_map = {str(n['id']): n.get('color', 'unknown').lower() for n in graph['nodes']}
    return {
        "general_red_nodes": sum(1 for c in color_map.values() if c == 'red'),
        "general_blue_nodes": sum(1 for c in color_map.values() if c == 'blue'),
        "general_green_nodes": sum(1 for c in color_map.values() if c == 'green'),
        "total_nodes": len(graph['nodes'])
    }

# =============================================================
# SOLUTION PARSING
# =============================================================
def get_staircase_triplets(solution):
    triplets = []
    for var_name, val in solution.items():
        # Updated to handle potential dots/dashes in node/edge IDs
        if var_name.startsWith('c_n') and val > 0.5:
            # Format: c_n{center}_e{e1}_{e2}_{e3}
            parts = var_name.split('_e')
            center = parts[0].replace('c_n', '')
            edges = parts[1].split('_')
            triplets.append({"center": center, "edges": edges})
    return triplets

def count_raw_endpoints(triplets, color_map, edge_map):
    """3:1 Weighting: Center counts 3x, Neighbors count 1x."""
    red = blue = green = 0
    for t in triplets:
        center = t["center"]
        c_color = color_map.get(center)
        if c_color == "red": red += 3
        elif c_color == "blue": blue += 3
        elif c_color == "green": green += 3
        
        for edge_id in t["edges"]:
            if edge_id in edge_map:
                source, target = edge_map[edge_id]
                other_end = target if source == center else source
                o_color = color_map.get(other_end)
                if o_color == "red": red += 1
                elif o_color == "blue": blue += 1
                elif o_color == "green": green += 1
    return red, blue, green

# =============================================================
# MAIN EXPERIMENT PIPELINE
# =============================================================
def main():
    # Find all LP files matching our 0 and 0.5 patterns
    lp_files = []
    for pattern in LP_PATTERNS:
        lp_files.extend(glob.glob(os.path.join(INPUT_DIR, pattern)))

    if not lp_files:
        print(f"No LP files found in {INPUT_DIR} matching patterns.")
        return

    summary_results = {}

    for lp_path in sorted(lp_files):
        sol_path = lp_path.replace(".lp", ".sol")
        # Map back to original json: remove the fairness suffix
        json_filename = os.path.basename(lp_path).split("_fairness")[0] + ".json"
        json_path = os.path.join(INPUT_DIR, json_filename)
        
        print("\n" + "="*60)
        print(f"Solving: {os.path.basename(lp_path)}")
        
        # 1. Run Gurobi
        start_time = time.time()
        try:
            subprocess.run(
                ["gurobi_cl", f"ResultFile={sol_path}", "TimeLimit=60", lp_path],
                check=True, capture_output=True, text=True
            )
        except Exception:
            print(f"ERROR: Gurobi failed on {lp_path}")
            continue
        elapsed = time.time() - start_time

        # 2. Load Graph and Solution
        if not os.path.exists(json_path):
            print(f"Skipping: Original JSON not found at {json_path}")
            continue

        with open(json_path, 'r') as f:
            graph = json.load(f)
        
        color_map = {str(n['id']): n.get('color', 'unknown').lower() for n in graph['nodes']}
        edge_map = {str(e['id']): (str(e['source']), str(e['target'])) for e in graph['links']}
        
        solution = {}
        if os.path.exists(sol_path):
            with open(sol_path, 'r') as f:
                for line in f:
                    if line.startswith('#') or not line.strip(): continue
                    parts = line.split()
                    if len(parts) >= 2: solution[parts[0]] = float(parts[1])

        # 3. Calculate Weighted Stats
        triplets = get_staircase_triplets(solution)
        r_weight, b_weight, g_weight = count_raw_endpoints(triplets, color_map, edge_map)
        
        # Calculate Imbalance (Max difference between any two groups)
        weights = [r_weight, b_weight, g_weight]
        imbalance = max(weights) - min(weights)

        # 4. Results Logging
        variant_name = "Fairness_0.5" if "l2_05" in lp_path else "No_Fairness_0"
        res_key = f"{json_filename} [{variant_name}]"
        
        summary_results[res_key] = {
            "time": round(elapsed, 2),
            "staircases": len(triplets),
            "weighted_red": r_weight,
            "weighted_blue": b_weight,
            "weighted_green": g_weight,
            "imbalance": imbalance
        }

        print(f"Done in {elapsed:.1f}s | Staircases: {len(triplets)} | Imbalance: {imbalance}")

    # Save summary
    output_fn = "group3_experiment_results.json"
    with open(output_fn, "w") as f:
        json.dump(summary_results, f, indent=4)
    print(f"\nExperiment complete. Results saved to {output_fn}")

if __name__ == "__main__":
    main()