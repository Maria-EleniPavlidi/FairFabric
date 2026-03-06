function render_biofabric(graph, ordernodes, orderedges, result, nodetitle, edgetitle, print_title = true, stroke_width = 3, rect_size = 5, use_node_colors = false){
  
    let svgwidth = 500;
    let svgheight = 500;
    let padding = {left: 30, right: 20, top: (print_title? 40 : 20), bottom: 50}
    let color_by_staircase = true;
    let show_node_indices = true;
    let show_edge_indices = false;
    
    const svg = d3.create('svg')
        .attr("viewBox", [0, 0, svgwidth, svgheight])
  
    let numnodes = graph.nodes.length;
    let numedges = graph.links.length;
  
    if (print_title) svg.append("text")
      .attr("x", svgwidth/2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-family", "Arial")
      .style("font-weight", "bold")
      .style("fill", "gray")
      .text(nodetitle + " + " + edgetitle)
  
    let node_h_dict = {}
  
    for (let i in ordernodes){
      let line_h = padding.top + (svgheight - padding.top - padding.bottom)/numnodes * i
  
      node_h_dict[ordernodes[i]] = line_h;
      
      // Determine node line color 
      let nodeColor = "rgba(238, 238, 238, 0.5)"; // default light gray 
      
      if (use_node_colors) { // ONLY apply node colors when use_node_colors is true
        let currentNode = graph.nodes.find(n => n.id === ordernodes[i]);
        if (currentNode && currentNode.color) {
          if (currentNode.color === 'blue') {
            nodeColor = 'rgba(0, 0, 255, 0.5)'; 
          } else if (currentNode.color === 'red') {
            nodeColor = 'rgba(255, 0, 0, 0.5)'; 
          }
          else if (currentNode.color === 'green') {
            nodeColor = 'rgba(26, 196, 32, 0.5)'; 
          }
        }
      }
      
      svg.append("line")
        .attr("stroke", nodeColor)
        .attr("stroke-width", 3)
        .style("stroke-linecap", "round")
        .attr("x1", padding.left)
        .attr("x2", svgwidth - padding.left)
        .attr("y1", line_h)
        .attr("y2", line_h)
  
      if (show_node_indices) svg.append("text")
        .attr("x", padding.left - 10)
        .attr("y", line_h + .2 * (svgheight - padding.top - padding.bottom)/(numnodes))
        .style("font-size", "small")
        .style("fill", "lightgray")
        .style("font-family", "Arial")
        .style("text-anchor", "end")
        .text(ordernodes[i])
    }

    for (let i in orderedges) {
      let line_x = padding.left + (svgwidth - padding.left - padding.right) / numedges * i;

      let edge = (graph?.links || graph?.edges || []).find(e => e.id == orderedges[i]);
      if (!edge) {
        console.warn("Edge not found for id:", orderedges[i]);
        continue;
      }

      let topnode_h = node_h_dict[edge.source];
      let bottomnode_h = node_h_dict[edge.target];

      let highestnode = Math.max(topnode_h, bottomnode_h);
      let lowestnode = Math.min(topnode_h, bottomnode_h);

      let possible_stair = undefined;
      let index_of_possible_stair = undefined;

      let how_many_stairs_share_this_edge = result.stairs.filter(s => s.includes(orderedges[i])).length;
      if (how_many_stairs_share_this_edge != 0) {
        possible_stair = result.stairs.find(s => s.includes(orderedges[i]));
        index_of_possible_stair = result.stairs.findIndex(s => s.includes(orderedges[i]));
      }

      let staircase_color_1 = "#F9D466";
      let staircase_color_2 = "#f7a222";

      if (how_many_stairs_share_this_edge) {
        svg.append("line")
          .attr("stroke", () => {
            if (!color_by_staircase) return "gray";
            else {
              if (possible_stair != undefined) {
                return index_of_possible_stair % 2 == 0 ? staircase_color_2 : staircase_color_1;
              } else return "gray";
            }
          })
          .attr("stroke-width", stroke_width)
          .style("stroke-linecap", "round")
          .attr("x1", line_x)
          .attr("x2", line_x)
          .attr("y1", topnode_h)
          .attr("y2", bottomnode_h);
      }

      
      svg.append("line")
        .attr("stroke", () => {
          if (!color_by_staircase) return "gray"
          else {
            if (possible_stair != undefined) {
              if (index_of_possible_stair%2 == 0) return staircase_color_1
              else return staircase_color_2
            } else return "gray"
          }
        })
        .attr("stroke-width", stroke_width)
          .style("stroke-linecap", "round")
          .attr("x1", line_x)
          .attr("x2", line_x)
          .attr("y1", topnode_h)
          .attr("y2", bottomnode_h)
        .style("stroke-dasharray", () => {
          if (how_many_stairs_share_this_edge == 2) return "6,20"
          else return "none"
        })
        .on("mouseover", function(){
          let edge_id = orderedges[i]
          let edge = graph.links.find(e => e.id == edge_id)
          console.log(edge.id)
        })

      if (show_edge_indices) svg.append("text")
        .attr("x", line_x - rect_size/2)
        .attr("y", padding.top - 8 + i%2 * 6)
        .style("font-size", "0.3em")
        .style("font-family", "Arial")
        .style("text-anchor", "start")
        .style("fill", "lightgray")
        .text(orderedges[i])
    }
    
    return svg.node();
}