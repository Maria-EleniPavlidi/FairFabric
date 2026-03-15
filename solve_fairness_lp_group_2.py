import os
import glob
import subprocess
import json
import time

# =============================================================
# CONFIGURATION
# =============================================================
# Directory containing the LP models produced by the fairness
INPUT_DIR = "data/rome-lib/group_2"
TARGET_GRAPH = "*"
LP_PATTERNS = [
    f"{TARGET_GRAPH}_fairness_l2_0.lp",
    f"{TARGET_GRAPH}_fairness_l2_05.lp",
]


# =============================================================
# GRAPH STATISTICS
# =============================================================

def get_general_stats(graph):
    """
    Compute basic statistics about the graph.

    Parameters
    ----------
    graph : dict
        Graph loaded from the JSON dataset.

    Returns
    -------
    dict
        Number of red nodes, blue nodes, and total nodes.
    """

    color_map = {str(n['id']): n.get('color', 'unknown').lower() for n in graph['nodes']}

    red = sum(1 for c in color_map.values() if c == 'red')
    blue = sum(1 for c in color_map.values() if c == 'blue')

    return {
        "general_red_nodes": red,
        "general_blue_nodes": blue,
        "total_nodes": len(graph['nodes'])
    }


# =============================================================
# SOLUTION PARSING
# =============================================================

def get_staircase_triplets(solution):
    """
    Extract active staircase variables from the solver solution.

    Staircases in the LP model are represented by binary variables
    of the form:

        c_n{center}_e{e1}_{e2}_{e3}

    When such a variable equals 1, the three edges form an
    epsilon-staircase centered at the given node.

    Parameters
    ----------
    solution : dict
        Mapping variable_name -> value from the .sol file.

    Returns
    -------
    list
        List of detected staircase triplets.
    """

    triplets = []

    for var_name, val in solution.items():

        if var_name.startswith('c_n') and val > 0.5:

            parts = var_name.split('_')

            center = parts[1].replace('n', '')

            edges = [
                parts[2].replace('e', ''),
                parts[3].replace('e', ''),
                parts[4].replace('e', '')
            ]

            triplets.append({
                "center": center,
                "edges": edges
            })

    return triplets


# =============================================================
# RAW ENDPOINT COUNTING
# =============================================================

def count_raw_endpoints(triplets, color_map, edge_map):
    """
    Count color occurrences assuming each triplet is independent.

    Each staircase triplet contributes 6 endpoint
    occurrences:

        3 occurrences of the center node
        3 occurrences of the outer nodes

    This metric reflects the *raw optimization variables*
    rather than merged staircases.
    """

    red = 0
    blue = 0

    for t in triplets:

        center = t["center"]

        # center appears 3 times in a triplet
        c_color = color_map.get(center)

        if c_color == "red":
            red += 3
        elif c_color == "blue":
            blue += 3

        # process the outer endpoints
        for edge_id in t["edges"]:

            if edge_id in edge_map:

                source, target = edge_map[edge_id]

                other_end = target if source == center else source

                o_color = color_map.get(other_end)

                if o_color == "red":
                    red += 1
                elif o_color == "blue":
                    blue += 1

    return red, blue


# =============================================================
# SOLUTION FILE PARSER
# =============================================================

def parse_solution(sol_path, color_map=None, edge_map=None):
    """
    Parse the Gurobi solution file and compute staircase statistics.

    The solution file contains values of all LP variables.
    We extract staircase variables and compute fairness metrics.
    """

    stats = {
        "staircase_count": 0,
        "staircase_red_endpoints": 0,
        "staircase_blue_endpoints": 0,
        "staircase_total_endpoints": 0,
        "raw_triplets": 0,
        "raw_red_endpoints": 0,
        "raw_blue_endpoints": 0,
        "staircases": [],
        "expected_total_endpoints": 0
    }

    if not os.path.exists(sol_path):
        return stats

    solution = {}

    # read solution variables
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

        stats["raw_red_endpoints"], stats["raw_blue_endpoints"] = \
            count_raw_endpoints(triplets, color_map, edge_map)

        red, blue, staircases = \
            count_direct_from_triplets(triplets, color_map, edge_map)

        stats["staircase_count"] = len(staircases)
        stats["staircases"] = staircases

        stats["staircase_red_endpoints"] = red
        stats["staircase_blue_endpoints"] = blue

    stats["staircase_total_endpoints"] = (
        stats["staircase_red_endpoints"] + stats["staircase_blue_endpoints"]
    )

    return stats


# =============================================================
# MAIN EXPERIMENT PIPELINE
# =============================================================

def main():

    # locate LP models
    lp_files = []
    for pattern in LP_PATTERNS:
        lp_files.extend(glob.glob(os.path.join(INPUT_DIR, pattern)))
    lp_files = sorted(set(lp_files))

    if not lp_files:
        print(f"No LP files found in {INPUT_DIR}.")
        return

    summary_results = {}

    totals = {
        "raw_red_endpoints": 0,
        "raw_blue_endpoints": 0,
        "staircase_red_endpoints": 0,
        "staircase_blue_endpoints": 0,
        "expected_total_endpoints": 0,
    }

    # =========================================================
    # PROCESS EACH GRAPH
    # =========================================================

    for lp_path in sorted(lp_files):

        sol_path = lp_path.replace(".lp", ".sol")

        json_path = lp_path
        json_path = json_path.replace("_fairness_l2_0.lp", ".json")
        json_path = json_path.replace("_fairness_l2_05.lp", ".json")

        print("\n" + "="*80)
        print(f"Processing {os.path.basename(lp_path)}")
        print("="*80)

        # run Gurobi
        start_time = time.time()

        try:

            subprocess.run(
                ["gurobi_cl", "TimeLimit=10", f"ResultFile={sol_path}", lp_path],
                check=True,
                capture_output=True,
                text=True
            )

        except Exception:

            print(f"Gurobi failed to solve {lp_path}")
            continue

        elapsed_time = time.time() - start_time

        # load graph
        with open(json_path, 'r') as f:
            graph = json.load(f)

        gen_stats = get_general_stats(graph)

        color_map = {
            str(n['id']): n.get('color', 'unknown').lower()
            for n in graph['nodes']
        }

        edge_map = {
            str(e['id']): (str(e['source']), str(e['target']))
            for e in graph['links']
        }

        sol_stats = parse_solution(sol_path, color_map, edge_map)

        # accumulate totals
        totals["raw_red_endpoints"] += sol_stats["raw_red_endpoints"]
        totals["raw_blue_endpoints"] += sol_stats["raw_blue_endpoints"]

        totals["staircase_red_endpoints"] += sol_stats["staircase_red_endpoints"]
        totals["staircase_blue_endpoints"] += sol_stats["staircase_blue_endpoints"]

        totals["expected_total_endpoints"] += sol_stats["expected_total_endpoints"]

        totals["merged_total_endpoints"] += sol_stats["staircase_total_endpoints"]

        # =====================================================
        # TERMINAL OUTPUT
        # =====================================================

        print(f"Graph nodes: {gen_stats['general_red_nodes']}R, {gen_stats['general_blue_nodes']}B")

        print(f"Raw triplets: {sol_stats['raw_triplets']}")

        if sol_stats['expected_total_endpoints'] > 0:

            raw_r_pct = (
                sol_stats['raw_red_endpoints'] /
                sol_stats['expected_total_endpoints']
            ) * 100

            raw_b_pct = (
                sol_stats['raw_blue_endpoints'] /
                sol_stats['expected_total_endpoints']
            ) * 100

            print(
                f"Raw endpoints: {sol_stats['raw_red_endpoints']}R, "
                f"{sol_stats['raw_blue_endpoints']}B "
                f"(Total: {sol_stats['expected_total_endpoints']})"
            )

            print(f"Fairness (Raw): {raw_r_pct:.1f}% R, {raw_b_pct:.1f}% B")

        print(f"Merged staircases: {sol_stats['staircase_count']}")

        print(
            f"Actual occurrences: {sol_stats['staircase_red_endpoints']}R, "
            f"{sol_stats['staircase_blue_endpoints']}B "
            f"(Total: {sol_stats['staircase_total_endpoints']})"
        )

        if sol_stats['staircase_total_endpoints'] > 0:

            m_r_pct = (
                sol_stats['staircase_red_endpoints'] /
                sol_stats['staircase_total_endpoints']
            ) * 100

            m_b_pct = (
                sol_stats['staircase_blue_endpoints'] /
                sol_stats['staircase_total_endpoints']
            ) * 100

            print(f"Fairness (Merged): {m_r_pct:.1f}% R, {m_b_pct:.1f}% B")

            print(
                "Imbalance (Merged): "
                f"{abs(sol_stats['staircase_red_endpoints'] - sol_stats['staircase_blue_endpoints'])}"
            )

        print(f"Time: {elapsed_time:.2f}s")

        summary_results[os.path.basename(json_path)] = {
            "graph_nodes": gen_stats,
            "raw_stats": {
                "red": sol_stats["raw_red_endpoints"],
                "blue": sol_stats["raw_blue_endpoints"],
                "total": sol_stats["expected_total_endpoints"]
            },
            "merged_stats": {
                "red": sol_stats["staircase_red_endpoints"],
                "blue": sol_stats["staircase_blue_endpoints"],
                "total": sol_stats["staircase_total_endpoints"]
            }
        }

    # =========================================================
    # SAVE SUMMARY
    # =========================================================

    with open("biofabric_summary_stats_v2.json", "w") as f:
        json.dump({"per_graph": summary_results}, f, indent=4)


if __name__ == "__main__":
    main()
