import json
import glob
import os
import networkx as nx
import numpy as np
from sklearn.cluster import SpectralClustering

def partition_and_save_rome_graphs(input_folder, output_folder):
    # 1. Create output directory if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Created output folder at: {output_folder}")

    # 2. Find all grafoXXX.json files
    search_pattern = os.path.join(input_folder, "grafo*.json")
    files = glob.glob(search_pattern)
    
    if not files:
        print(f"No files found in {input_folder}! Make sure the script is in the same folder as your JSON files.")
        return

    print(f"Processing {len(files)} files...")

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

        # 3. Spectral Bisection (Normalized Cut)
        adj_matrix = nx.to_numpy_array(G)
        
        # We use 2 clusters as requested
        sc = SpectralClustering(
            n_clusters=2, 
            affinity='precomputed', 
            assign_labels='kmeans', 
            random_state=42
        )
        
        try:
            labels = sc.fit_predict(adj_matrix)
        except Exception as e:
            print(f"Skipping {file_name} due to error: {e}")
            continue

        # 4. Create the new JSON structure
        new_nodes = []
        for i, node_id in enumerate(G.nodes()):
            # Cluster 0 = Blue, Cluster 1 = Red
            color = "blue" if labels[i] == 0 else "red"
            new_nodes.append({"id": int(node_id), "color": color})

        output_data = {
            "nodes": new_nodes,
            "links": data['links'] 
        }

        # 5. Save to new file
        output_file_path = os.path.join(output_folder, f"partitioned_{file_name}")
        with open(output_file_path, 'w') as f:
            json.dump(output_data, f, indent=4)
        
        print(f"Done: {file_name}")

# --- THIS IS THE PART THAT TRIGGER THE EXECUTION ---
if __name__ == "__main__":
    # Get the folder where this script is currently saved
    current_directory = os.path.dirname(os.path.abspath(__file__))
    
    # We will put the results in a sub-folder called 'output_results'
    target_output = os.path.join(current_directory, "output_results")
    
    # Run the function
    partition_and_save_rome_graphs(current_directory, target_output)
    
    print("\n" + "="*30)
    print("SUCCESS: All graphs partitioned!")
    print("="*30)