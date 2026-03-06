import os
import glob
import subprocess
import json
import time

# =============================================================
# CONFIGURATION
# =============================================================
INPUT_DIR = "data/rome-lib/group_2"
LP_PATTERN = "partitioned_grafo*_fairness.lp"


# =============================================================
# GRAPH STATISTICS
# =============================================================
def get_general_stats(graph):
    color_map = {str(n['id']): n.get('color', 'unknown').lower() for n in graph['nodes']}
    red = sum(1 for c in color_map.values() if c == 'red')
    blue = sum(1 for c in color_map.values() if c == 'blue')
    green = sum(1 for c in color_map.values() if c == 'green')
    return {
        "general_red_nodes": red,
        "general_blue_nodes": blue,
        "general_green_nodes": green,
        "total_nodes": len(graph['nodes'])
    }


# =============================================================
# SOLUTION PARSING
# =============================================================
def get_staircase_triplets(solution):
    triplets = []
    for var_name, val in solution.items():
        if var_name.startswith('c_n') and val > 0.5:
            parts = var_name.split('_')
            center = parts[1].replace('n', '')
            edges = [parts[2].replace('e', ''),
                     parts[3].replace('e', ''),
                     parts[4].replace('e', '')]
            triplets.append({"center": center, "edges": edges})
    return triplets


# =============================================================
# RAW ENDPOINT COUNTING
# =============================================================
def count_raw_endpoints(triplets, color_map, edge_map):
    red = blue = green = 0
    for t in triplets:
        center = t["center"]
        c_color = color_map.get(center)
        if c_color == "red": red += 3
        elif c_color == "blue": blue += 3
        elif c_color == "green": green += 3
        for edge_id in t["edges"]:
            edge_id = str(edge_id)
            if edge_id in edge_map:
                source, target = edge_map[edge_id]
                other_end = target if source == center else source
                o_color = color_map.get(other_end)
                if o_color == "red": red += 1
                elif o_color == "blue": blue += 1
                elif o_color == "green": green += 1
    return red, blue, green


# =============================================================
# MERGED STAIRCASE COUNTING
# =============================================================
def count_direct_from_triplets(triplets, color_map, edge_map):
    red = blue = green = 0
    staircase_list = []

    # group triplets by center
    by_center = {}
    for t in triplets:
        center = t["center"]
        if center not in by_center:
            by_center[center] = set()
        for e in t["edges"]:
            by_center[center].add(str(e))

    for center, edges in by_center.items():
        edges = sorted(edges)
        num_edges = len(edges)
        center_color = color_map.get(center)
        if center_color == "red": red += num_edges
        elif center_color == "blue": blue += num_edges
        elif center_color == "green": green += num_edges

        endpoint_list = []
        for edge_id in edges:
            if edge_id not in edge_map:
                continue
            source, target = edge_map[edge_id]
            other_end = target if source == center else source
            endpoint_list.append(other_end)
            other_color = color_map.get(other_end)
            if other_color == "red": red += 1
            elif other_color == "blue": blue += 1
            elif other_color == "green": green += 1

        staircase_list.append({
            "center": center,
            "edges": edges,
            "length": num_edges,
            "center_color": center_color,
            "endpoints": endpoint_list,
            "endpoint_colors": [color_map.get(e) for e in endpoint_list],
            "total_endpoint_occurrences": 2 * num_edges
        })

    return red, blue, green, staircase_list


# =============================================================
# SOLUTION FILE PARSER
# =============================================================
def parse_solution(sol_path, color_map=None, edge_map=None):
    stats = {
        "staircase_count": 0,
        "staircase_red_endpoints": 0,
        "staircase_blue_endpoints": 0,
        "staircase_green_endpoints": 0,
        "staircase_total_endpoints": 0,
        "raw_triplets": 0,
        "raw_red_endpoints": 0,
        "raw_blue_endpoints": 0,
        "raw_green_endpoints": 0,
        "staircases": [],
        "expected_total_endpoints": 0
    }

    if not os.path.exists(sol_path):
        return stats

    solution = {}
    with open(sol_path, 'r') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            parts = line.split()
            if len(parts) >= 2:
                solution[parts[0]] = float(parts[1])

    triplets = get_staircase_triplets(solution)
    stats["raw_triplets"] = len(triplets)
    stats["expected_total_endpoints"] = len(triplets) * 6

    if triplets and color_map and edge_map:
        stats["raw_red_endpoints"], stats["raw_blue_endpoints"], stats["raw_green_endpoints"] = \
            count_raw_endpoints(triplets, color_map, edge_map)

        red, blue, green, staircases = count_direct_from_triplets(triplets, color_map, edge_map)
        stats["staircase_count"] = len(staircases)
        stats["staircases"] = staircases
        stats["staircase_red_endpoints"] = red
        stats["staircase_blue_endpoints"] = blue
        stats["staircase_green_endpoints"] = green
        stats["staircase_total_endpoints"] = red + blue + green

    return stats


# =============================================================
# MAIN EXPERIMENT PIPELINE
# =============================================================
def main():
    lp_files = glob.glob(os.path.join(INPUT_DIR, LP_PATTERN))
    if not lp_files:
        print(f"No LP files found in {INPUT_DIR}.")
        return

    summary_results = {}
    totals = {
        "raw_red_endpoints": 0,
        "raw_blue_endpoints": 0,
        "raw_green_endpoints": 0,
        "staircase_red_endpoints": 0,
        "staircase_blue_endpoints": 0,
        "staircase_green_endpoints": 0,
        "expected_total_endpoints": 0,
        "merged_total_endpoints": 0
    }

    for lp_path in sorted(lp_files):
        sol_path = lp_path.replace(".lp", ".sol")
        json_path = lp_path.replace("_fairness.lp", ".json")
        print("\n" + "="*80)
        print(f"Processing {os.path.basename(lp_path)}")
        print("="*80)

        # Run Gurobi
        start_time = time.time()
        try:
            subprocess.run(
                ["gurobi_cl", f"ResultFile={sol_path}", lp_path],
                check=True,
                capture_output=True,
                text=True
            )
        except Exception:
            print(f"Gurobi failed to solve {lp_path}")
            continue
        elapsed_time = time.time() - start_time

        # Load graph
        with open(json_path, 'r') as f:
            graph = json.load(f)

        gen_stats = get_general_stats(graph)
        color_map = {str(n['id']): n.get('color', 'unknown').lower() for n in graph['nodes']}
        edge_map = {str(e['id']): (str(e['source']), str(e['target'])) for e in graph['links']}

        sol_stats = parse_solution(sol_path, color_map, edge_map)

        # Accumulate totals
        totals["raw_red_endpoints"] += sol_stats["raw_red_endpoints"]
        totals["raw_blue_endpoints"] += sol_stats["raw_blue_endpoints"]
        totals["raw_green_endpoints"] += sol_stats["raw_green_endpoints"]
        totals["staircase_red_endpoints"] += sol_stats["staircase_red_endpoints"]
        totals["staircase_blue_endpoints"] += sol_stats["staircase_blue_endpoints"]
        totals["staircase_green_endpoints"] += sol_stats["staircase_green_endpoints"]
        totals["expected_total_endpoints"] += sol_stats["expected_total_endpoints"]
        totals["merged_total_endpoints"] += sol_stats["staircase_total_endpoints"]

        # Terminal output
        print(f"Graph nodes: {gen_stats['general_red_nodes']}R, "
              f"{gen_stats['general_blue_nodes']}B, {gen_stats['general_green_nodes']}G")

        print(f"Raw triplets: {sol_stats['raw_triplets']}")
        if sol_stats['expected_total_endpoints'] > 0:
            raw_r_pct = sol_stats['raw_red_endpoints'] / sol_stats['expected_total_endpoints'] * 100
            raw_b_pct = sol_stats['raw_blue_endpoints'] / sol_stats['expected_total_endpoints'] * 100
            raw_g_pct = sol_stats['raw_green_endpoints'] / sol_stats['expected_total_endpoints'] * 100
            print(f"Raw endpoints: {sol_stats['raw_red_endpoints']}R, "
                  f"{sol_stats['raw_blue_endpoints']}B, {sol_stats['raw_green_endpoints']}G "
                  f"(Total: {sol_stats['expected_total_endpoints']})")
            print(f"Fairness (Raw): {raw_r_pct:.1f}% R, {raw_b_pct:.1f}% B, {raw_g_pct:.1f}% G")

        print(f"Merged staircases: {sol_stats['staircase_count']}")
        print(f"Actual occurrences: {sol_stats['staircase_red_endpoints']}R, "
              f"{sol_stats['staircase_blue_endpoints']}B, {sol_stats['staircase_green_endpoints']}G "
              f"(Total: {sol_stats['staircase_total_endpoints']})")

        if sol_stats['staircase_total_endpoints'] > 0:
            m_r_pct = sol_stats['staircase_red_endpoints'] / sol_stats['staircase_total_endpoints'] * 100
            m_b_pct = sol_stats['staircase_blue_endpoints'] / sol_stats['staircase_total_endpoints'] * 100
            m_g_pct = sol_stats['staircase_green_endpoints'] / sol_stats['staircase_total_endpoints'] * 100
            print(f"Fairness (Merged): {m_r_pct:.1f}% R, {m_b_pct:.1f}% B, {m_g_pct:.1f}% G")
            print(   "Imbalance (Merged): "
            f"{max(sol_stats['staircase_red_endpoints'], sol_stats['staircase_blue_endpoints'], sol_stats['staircase_green_endpoints']) - min(sol_stats['staircase_red_endpoints'], sol_stats['staircase_blue_endpoints'], sol_stats['staircase_green_endpoints'])}")
            print(f"Time: {elapsed_time:.2f}s")

        summary_results[os.path.basename(json_path)] = {
            "graph_nodes": gen_stats,
            "raw_stats": {
                "red": sol_stats["raw_red_endpoints"],
                "blue": sol_stats["raw_blue_endpoints"],
                "green": sol_stats["raw_green_endpoints"],
                "total": sol_stats["expected_total_endpoints"]
            },
            "merged_stats": {
                "red": sol_stats["staircase_red_endpoints"],
                "blue": sol_stats["staircase_blue_endpoints"],
                "green": sol_stats["staircase_green_endpoints"],
                "total": sol_stats["staircase_total_endpoints"]
            }
        }

    # Save summary JSON
    with open("biofabric_summary_stats_v3.json", "w") as f:
        json.dump({"per_graph": summary_results, "totals": totals}, f, indent=4)


if __name__ == "__main__":
    main()