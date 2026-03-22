import json
import glob
import os
import networkx as nx
import numpy as np
from sklearn.cluster import SpectralClustering

def partition_rome_three_groups(input_folder, output_folder):
    # 1. Create output directory if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Created output folder at: {output_folder}")

    # 2. Find all grafoXXX.json files
    search_pattern = os.path.join(input_folder, "grafo*.json")
    files = glob.glob(search_pattern)
    
    if not files:
        print(f"No files found in {input_folder}! Check your folder path.")
        return

    # Mapping cluster numbers to colors
    colors_map = {0: "blue", 1: "red", 2: "green"}

    print(f"Processing {len(files)} files into 3 groups...")

    for file_path in files:
        file_name = os.path.basename(file_path)
        
        with open(file_path, 'r') as f:
            data = json.load(f)

        # Build Graph
        G = nx.Graph()
        for node in data['nodes']:
            G.add_node(node['id'])
        for link in data['links']:
            G.add_edge(link['source'], link['target'])

        # 3. Spectral Clustering for 3 clusters
        adj_matrix = nx.to_numpy_array(G)
        
        # We increase n_clusters to 3
        sc = SpectralClustering(
            n_clusters=3, 
            affinity='precomputed', 
            assign_labels='kmeans', 
            random_state=42
        )
        
        try:
            labels = sc.fit_predict(adj_matrix)
        except Exception as e:
            print(f"Skipping {file_name}: Graph might be too small for 3 groups ({e})")
            continue

        # 4. Create the new JSON structure
        new_nodes = []
        for i, node_id in enumerate(G.nodes()):
            # Map cluster index (0, 1, 2) to (blue, red, green)
            color = colors_map[labels[i]]
            new_nodes.append({"id": int(node_id), "color": color})

        output_data = {
            "nodes": new_nodes,
            "links": data['links'] 
        }

        # 5. Save to the 'group_3' folder
        output_file_path = os.path.join(output_folder, f"tri_partitioned_{file_name}")
        with open(output_file_path, 'w') as f:
            json.dump(output_data, f, indent=4)
        
        print(f"Done: {file_name}")

# --- EXECUTION BLOCK ---
if __name__ == "__main__":
    # Locate the folder where this script is saved
    current_directory = os.path.dirname(os.path.abspath(__file__))
    
    # Target output folder named 'group_3'
    target_output = os.path.join(current_directory, "group_3")
    
    # Run the function
    partition_rome_three_groups(current_directory, target_output)
    
    print("\n" + "="*40)
    print("SUCCESS: 3-Way Partitioning Complete!")
    print("Files are in the 'group_3' folder.")
    print("="*40)