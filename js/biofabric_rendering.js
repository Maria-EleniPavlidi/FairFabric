function render_biofabric(graph, ordernodes, orderedges, result, nodetitle, edgetitle, print_title = true, stroke_width = 3, rect_size = 5, use_node_colors = false, show_edge_indices = false){
  
    let svgwidth = 500;
    let svgheight = 500;
    let padding = {left: 30, right: 20, top: (print_title? 40 : 20), bottom: 50}
    let color_by_staircase = true;
    let show_node_indices = true;
    
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
    let node_color_dict = {}
    const node_by_id = new Map(graph.nodes.map((n) => [String(n.id), n]));

    function edgeColorFromNodeColor(color) {
      const c = String(color || "").toLowerCase();
      if (c === "red") return "#BE4F62";
      if (c === "blue") return "#5D8AA8";
      if (c === "green") return "#1ac420";
      return "#8a8a8a";
    }

    function getForegroundColorsForEdge(edge) {
      const srcKey = String(edge.source);
      const dstKey = String(edge.target);
      const c1 = edgeColorFromNodeColor(node_color_dict[srcKey]);
      const c2 = edgeColorFromNodeColor(node_color_dict[dstKey]);
      return { c1, c2 };
    }
  
    for (let i in ordernodes){
      let line_h = padding.top + (svgheight - padding.top - padding.bottom)/numnodes * i
  
      const nodeKey = String(ordernodes[i]);
      node_h_dict[ordernodes[i]] = line_h;
      let currentNode = node_by_id.get(nodeKey);
      node_color_dict[nodeKey] = (currentNode?.color || "unknown");
      
      // Determine node line color 
      let nodeColor = "rgb(238, 238, 238)";
      let nodeOpacity = 0.15; // 0.5 * 0.3

      if (use_node_colors) {
        if (currentNode && currentNode.color) {
          if (currentNode.color === 'blue') {
            nodeColor = 'rgb(0, 0, 255)';
            nodeOpacity = 0.15;
          } else if (currentNode.color === 'red') {
            nodeColor = 'rgb(255, 0, 0)';
            nodeOpacity = 0.15;
          } else if (currentNode.color === 'green') {
            nodeColor = 'rgb(26, 196, 32)';
            nodeOpacity = 0.15;
          }
        }
      }
      
      svg.append("line")
        .attr("stroke", nodeColor)
        .attr("stroke-opacity", nodeOpacity)
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
        .style("fill", "white")
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

      if (how_many_stairs_share_this_edge) {
        svg.append("line")
          .attr("stroke", "white")
          .attr("stroke-width", stroke_width)
          .attr("stroke-opacity", 1)
          .style("stroke-linecap", "round")
          .attr("x1", line_x)
          .attr("x2", line_x)
          .attr("y1", topnode_h)
          .attr("y2", bottomnode_h);
      }

      
      svg.append("line")
        .attr("stroke", "white")
        .attr("stroke-width", stroke_width)
          .attr("stroke-opacity", how_many_stairs_share_this_edge ? 1 : 0.5)
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

      const fg = getForegroundColorsForEdge(edge);
      const fgWidth = Math.max(1.8, stroke_width * 0.55);
      const fgOpacity = how_many_stairs_share_this_edge ? 1 : 0.5;
      if (fg.c1 === fg.c2) {
        svg.append("line")
          .attr("stroke", fg.c1)
          .attr("stroke-width", fgWidth)
          .attr("stroke-opacity", fgOpacity)
          .style("stroke-linecap", "round")
          .attr("x1", line_x)
          .attr("x2", line_x)
          .attr("y1", topnode_h)
          .attr("y2", bottomnode_h);
      } else {
        const steps = 12;
        const gradientGroup = svg.append("g")
          .attr("opacity", fgOpacity);
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          gradientGroup.append("line")
            .attr("stroke", d3.interpolateRgb(fg.c1, fg.c2)((t0 + t1) / 2))
            .attr("stroke-width", fgWidth)
            .attr("stroke-opacity", 1)
            .style("stroke-linecap", "round")
            .attr("x1", line_x)
            .attr("x2", line_x)
            .attr("y1", topnode_h + (bottomnode_h - topnode_h) * t0)
            .attr("y2", topnode_h + (bottomnode_h - topnode_h) * t1);
        }
      }

      if (show_edge_indices) svg.append("text")
        .attr("x", line_x - rect_size/2)
        .attr("y", padding.top - 8)
        .style("font-size", "small")
        .style("font-family", "Arial")
        .style("text-anchor", "start")
        .style("fill", "white")
        .text(orderedges[i])
    }
    
    return svg.node();
}
