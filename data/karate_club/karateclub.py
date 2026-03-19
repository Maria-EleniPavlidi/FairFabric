import matplotlib.pyplot as plt
import networkx as nx
import json

G = nx.karate_club_graph()

# Define the colors from your LaTeX definitions
soft_blue = '#5D8AA8'  # SoftBlue
soft_red = '#BE4F62'   # SoftRed

# Get club assignment for node colors
node_colors = [soft_red if G.nodes[v]['club'] == 'Mr. Hi' else soft_blue for v in G.nodes()]

# Create edge colors list (using blended colors for cross-team edges)
def blend_colors(color1, color2):
    # Simple RGB average blend
    r1, g1, b1 = int(color1[1:3], 16), int(color1[3:5], 16), int(color1[5:7], 16)
    r2, g2, b2 = int(color2[1:3], 16), int(color2[3:5], 16), int(color2[5:7], 16)
    r = (r1 + r2) // 2
    g = (g1 + g2) // 2
    b = (b1 + b2) // 2
    return f'#{r:02x}{g:02x}{b:02x}'

edge_colors = []
for u, v in G.edges():
    if G.nodes[u]['club'] == G.nodes[v]['club']:
        edge_colors.append(soft_red if G.nodes[u]['club'] == 'Mr. Hi' else soft_blue)
    else:
        edge_colors.append(blend_colors(soft_red, soft_blue))

# Draw and save as PDF
plt.figure(figsize=(12, 10))
pos = nx.circular_layout(G)

nx.draw_networkx_edges(G, pos, edge_color=edge_colors, width=2)
nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=500)
nx.draw_networkx_labels(G, pos, font_size=12, font_weight='bold')

plt.title("Karate Club Graph - Team Colors", fontsize=16)
plt.axis('off')
plt.tight_layout()

# Save as PDF
plt.savefig('karate_club_graph.pdf', format='pdf', dpi=300, bbox_inches='tight')
plt.show()

# Create JSON data structure
def create_karate_json():
    # Create nodes list
    nodes = []
    for node in G.nodes():
        # Convert 'Mr. Hi' to 'red' and 'Officer' to 'blue' for the JSON
        color = 'red' if G.nodes[node]['club'] == 'Mr. Hi' else 'blue'
        nodes.append({
            "id": node,
            "color": color
        })
    
    # Create links list with IDs
    links = []
    for i, (source, target) in enumerate(G.edges()):
        links.append({
            "id": i,
            "source": source,
            "target": target
        })
    
    # Combine into final structure
    karate_data = {
        "nodes": nodes,
        "links": links
    }
    
    return karate_data

# Generate JSON data
karate_json = create_karate_json()

# Save to JSON file
with open('karate_club_data.json', 'w') as json_file:
    json.dump(karate_json, json_file, indent=4)

# Print to console as well (optional)
print(json.dumps(karate_json, indent=4))

# Verify the data matches your example
print("\n" + "="*50)
print("VERIFICATION:")
print(f"Number of nodes: {len(karate_json['nodes'])}")
print(f"Number of links: {len(karate_json['links'])}")

# Count nodes by color
red_count = sum(1 for node in karate_json['nodes'] if node['color'] == 'red')
blue_count = sum(1 for node in karate_json['nodes'] if node['color'] == 'blue')
print(f"Red nodes (Mr. Hi's team): {red_count}")
print(f"Blue nodes (Officer's team): {blue_count}")

# Show first few nodes and links as sample
print("\nSample nodes (first 5):")
for node in karate_json['nodes'][:5]:
    print(f"  {node}")

print("\nSample links (first 5):")
for link in karate_json['links'][:5]:
    print(f"  {link}")