function render_biofabric(graph, ordernodes, orderedges, result, nodetitle, edgetitle, print_title = true, stroke_width = 3, rect_size = 5){
  
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
      
      svg.append("line")
        .attr("stroke", "#eee")
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
  
    for (let i in orderedges){
      let line_x = padding.left + (svgwidth - padding.left - padding.right)/numedges * i
      
      let edge = graph.links.find(e => e.id == orderedges[i])
      let topnode_h = node_h_dict[edge.source]
      let bottomnode_h = node_h_dict[edge.target]
  
      let highestnode = Math.max(topnode_h, bottomnode_h)
      let lowestnode = Math.min(topnode_h, bottomnode_h)

      let possible_stair = undefined
      let index_of_possible_stair = undefined

      let how_many_stairs_share_this_edge = result.stairs.filter(s => s.includes(orderedges[i])).length
      if (how_many_stairs_share_this_edge != 0) {
        possible_stair = result.stairs.find(s => s.includes(orderedges[i]))
        index_of_possible_stair = result.stairs.findIndex(s => s.includes(orderedges[i]))
      }

      let staircase_color_1 = "#F9D466"
      let staircase_color_2 = "#f7a222"
      // let staircase_color_2 = "#3C7BAE"
      // let staircase_color_2 = "#25BBF7"

      if (how_many_stairs_share_this_edge){
        svg.append("line")
          .attr("stroke", () => {
            if (!color_by_staircase) return "gray"
            else {
              if (possible_stair != undefined) {
                if (index_of_possible_stair%2 == 0) return staircase_color_2
                else return staircase_color_1
              } else return "gray"
            }
          })
          .attr("stroke-width", stroke_width)
          .style("stroke-linecap", "round")
          .attr("x1", line_x)
          .attr("x2", line_x)
          .attr("y1", topnode_h)
          .attr("y2", bottomnode_h)
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

      // svg.append("rect")
      //   .attr("x", line_x - rect_size/2)
      //   .attr("y", highestnode - rect_size/2)
      //   .attr("width", rect_size)
      //   .attr("height", rect_size)
      //   .attr("rx", 3)
      //   .attr("ry", 3)
      //   .attr("fill", () => {
      //     if (!color_by_staircase) return "gray"
      //     else {
      //       if (possible_stair != undefined) {
      //         if (how_many_stairs_share_this_edge == 2) return d3.interpolate("#F7C225", "#3C7BAE")(0.5)
      //         if (index_of_possible_stair%2 == 0) return staircase_color_1
      //         else return staircase_color_2
      //       } else return "gray"
      //     }
      //   })

      // svg.append("rect")
      // .attr("x", line_x - rect_size/2)
      //   .attr("y", lowestnode - rect_size/2)
      //   .attr("width", rect_size)
      //   .attr("height", rect_size)
      //   .attr("rx", 3)
      //   .attr("ry", 3)
      // .attr("fill", () => {
      //   if (!color_by_staircase) return "gray"
      //   else {
      //     if (possible_stair != undefined) {
      //       if (how_many_stairs_share_this_edge == 2) return d3.interpolate("#F7C225", "#3C7BAE")(0.5)
      //       if (index_of_possible_stair%2 == 0) return staircase_color_1
      //       else return staircase_color_2
      //     } else return "gray"
      //   }
      // })
  
      // svg.append("rect")
      //   .attr("x", line_x - rect_size/2)
      //   .attr("y", highestnode - rect_size/2)
      //   .attr("width", rect_size)
      //   .attr("height", rect_size)
      //   .attr("rx", 3)
      //   .attr("ry", 3)
      //   .attr("fill", () => {
      //     if (!color_by_staircase) return "gray"
      //     else if (result.runways.length == 0) return "gray"
      //     else {
      //       let ind = parseInt(i)
      //       let possible_runway = result.runways.find(s => s.includes(orderedges[i]))
      //       console.log(possible_runway)
      //       if (possible_runway != undefined) {
      //         let col = "gray"
              
      //         if (orderedges[ind-1] != undefined){
      //           let prevedge = graph.links.find(e => e.id == orderedges[ind-1])
      //           if (node_h_dict[prevedge.source] == highestnode) col = "#F94144"
      //           if (node_h_dict[prevedge.target] == highestnode) col = "#F94144"
                
      //         }
      //         if (orderedges[ind+1] != undefined){
      //           let nextedge = graph.links.find(e => e.id == orderedges[ind+1])
      //           if (Math.round(10*node_h_dict[nextedge.source]) == Math.round(10*highestnode)) col = "#F94144"
      //           if (Math.round(10*node_h_dict[nextedge.target]) == Math.round(10*highestnode)) col = "#F94144"
      //         }
      //         return col
      //       }
      //       else return "gray"
      //     }})
  
      // svg.append("rect")
      //   .attr("x", line_x - rect_size/2)
      //   .attr("y", lowestnode - rect_size/2)
      //   .attr("width", rect_size)
      //   .attr("height", rect_size)
      //   .attr("rx", 3)
      //   .attr("ry", 3)
      //   .attr("fill", () => {
      //     if (!color_by_staircase) return "gray"
      //     else if (result.runways.length == 0) return "gray"
      //     else {
      //       let ind = parseInt(i)
      //       let possible_runway = result.runways.find(s => s.includes(orderedges[i]))
      //       if (possible_runway != undefined) {
      //         let col = "gray"
              
      //         if (orderedges[ind-1] != undefined){
      //           let prevedge = graph.links.find(e => e.id == orderedges[ind-1])
      //           if (node_h_dict[prevedge.source] == lowestnode) col = "#F94144"
      //           if (node_h_dict[prevedge.target] == lowestnode) col = "#F94144"
                
      //         }
      //         if (orderedges[ind+1] != undefined){
      //           let nextedge = graph.links.find(e => e.id == orderedges[ind+1])
      //           if (Math.round(10*node_h_dict[nextedge.source]) == Math.round(10*lowestnode)) col = "#F94144"
      //           if (Math.round(10*node_h_dict[nextedge.target]) == Math.round(10*lowestnode)) col = "#F94144"
      //         }
      //         return col
      //       }
      //       else return "gray"
      //     }})
  
      if (show_edge_indices) svg.append("text")
        .attr("x", line_x - rect_size/2)
        .attr("y", padding.top - 8 + i%2 * 6)
        .style("font-size", "0.3em")
        .style("font-family", "Arial")
        .style("text-anchor", "start")
        .style("fill", "lightgray")
        .text(orderedges[i])

      // svg.append("text")
      //   .attr("x", svgwidth/2)
      //   .attr("y", svgheight - 30)
      //   .attr("text-anchor", "middle")
      //   .text("quality: " + Math.round(result.stairQualities[result.stairQualities.length - 1]*100)/100)

      // svg.append("text")
      //   .attr("x", svgwidth/2)
      //   .attr("y", svgheight - 30)
      //   .attr("text-anchor", "middle")
      //   .text("quality: " + Math.round(result.stairQualities[result.stairQualities.length - 1]*100)/100)
    }
    
    
    return svg.node();
  }