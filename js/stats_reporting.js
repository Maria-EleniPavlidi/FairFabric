async function draw_result_scatterplots(parent_div, filenames, times){

    // append total number of graphs
    let total_num_graphs_div = document.createElement("div")
    total_num_graphs_div.className = "col-lg"
    parent_div.appendChild(total_num_graphs_div)

    // put a stats div on top of the page
    let stats = document.createElement("div")
    stats.className = "row"
    parent_div.appendChild(stats)

    // create a scatterplot for the results
    let scatterplot = document.createElement("div")
    scatterplot.className = "col-lg"
    stats.appendChild(scatterplot)

    // create new row
    let stats2 = document.createElement("div")
    stats2.className = "row"
    parent_div.appendChild(stats2)

    let scatterplot2 = document.createElement("div")
    scatterplot2.className = "col-lg"
    stats2.appendChild(scatterplot2)

    let stats3 = document.createElement("div")
    stats3.className = "row"
    parent_div.appendChild(stats3)

    let scatterplot3 = document.createElement("div")
    scatterplot3.className = "col-lg"
    stats3.appendChild(scatterplot3)

    let stats4 = document.createElement("div")
    stats4.className = "row"
    parent_div.appendChild(stats4)

    let scatterplot4 = document.createElement("div")
    scatterplot4.className = "col-lg"
    stats4.appendChild(scatterplot4)

    let stats5 = document.createElement("div")
    stats5.className = "row"
    parent_div.appendChild(stats5)

    let scatterplot5 = document.createElement("div")
    scatterplot5.className = "col-lg"
    stats5.appendChild(scatterplot5)

    let stats6 = document.createElement("div")
    stats6.className = "row"
    parent_div.appendChild(stats6)

    let scatterplot6 = document.createElement("div")
    scatterplot6.className = "col-lg"
    stats6.appendChild(scatterplot6)

    let stats7 = document.createElement("div")
    stats7.className = "row"
    parent_div.appendChild(stats7)

    let scatterplot7 = document.createElement("div")
    scatterplot7.className = "col-lg"
    stats7.appendChild(scatterplot7)

    let stats8 = document.createElement("div")
    stats8.className = "row"
    parent_div.appendChild(stats8)

    let scatterplot8 = document.createElement("div")
    scatterplot8.className = "col-lg"
    stats8.appendChild(scatterplot8)

    let stats9 = document.createElement("div")
    stats9.className = "row"
    parent_div.appendChild(stats9)

    let scatterplot9 = document.createElement("div")
    scatterplot9.className = "col-lg"
    stats9.appendChild(scatterplot9)


    // read file at lp_solutions/organized_results.json
    let results = await d3.json("" + options.solution_folder + "/organized_results.json")

    let time_by_num_nodes = results.time_by_num_nodes
    let time_by_num_edges = results.time_by_num_edges
    let time_by_density = results.time_by_density
    let time_by_max_degree = results.time_by_max_degree
    let time_by_avg_degree = results.time_by_avg_degree
    let timeouts_by_num_nodes = results.timeouts_by_num_nodes
    let timeouts_by_num_edges = results.timeouts_by_num_edges
    let timeouts_by_density = results.timeouts_by_density
    let timeouts_by_max_degree = results.timeouts_by_max_degree
    let timeouts_by_avg_degree = results.timeouts_by_avg_degree
    let numconstraints_by_num_nodes = results.numconstraints_by_num_nodes
    let numconstraints_by_num_edges = results.numconstraints_by_num_edges
    let numconstraints_by_density = results.numconstraints_by_density
    let numconstraints_by_max_degree = results.numconstraints_by_max_degree
    let numconstraints_by_avg_degree = results.numconstraints_by_avg_degree
    let numvariables_by_num_nodes = results.numvariables_by_num_nodes
    let numvariables_by_num_edges = results.numvariables_by_num_edges
    let numvariables_by_density = results.numvariables_by_density
    let numvariables_by_max_degree = results.numvariables_by_max_degree
    let numvariables_by_avg_degree = results.numvariables_by_avg_degree
    let total_num_graphs_by_num_nodes = results.total_num_graphs_by_num_nodes
    let total_num_graphs_by_num_edges = results.total_num_graphs_by_num_edges
    let total_num_graphs_by_density = results.total_num_graphs_by_density
    let total_num_graphs_by_max_degree = results.total_num_graphs_by_max_degree
    let total_num_graphs_by_avg_degree = results.total_num_graphs_by_avg_degree
    let runway_quality_by_num_nodes_degreecending = results.runway_quality_by_num_nodes_degreecending
    let runway_quality_by_num_edges_degreecending = results.runway_quality_by_num_edges_degreecending
    let runway_quality_by_density_degreecending = results.runway_quality_by_density_degreecending
    let runway_quality_by_max_degree_degreecending = results.runway_quality_by_max_degree_degreecending
    let runway_quality_by_avg_degree_degreecending = results.runway_quality_by_avg_degree_degreecending
    let staircase_quality_by_num_nodes_degreecending = results.staircase_quality_by_num_nodes_degreecending
    let staircase_quality_by_num_edges_degreecending = results.staircase_quality_by_num_edges_degreecending
    let staircase_quality_by_density_degreecending = results.staircase_quality_by_density_degreecending
    let staircase_quality_by_max_degree_degreecending = results.staircase_quality_by_max_degree_degreecending
    let staircase_quality_by_avg_degree_degreecending = results.staircase_quality_by_avg_degree_degreecending
    let runway_quality_by_num_nodes_ilp = results.runway_quality_by_num_nodes_ilp
    let runway_quality_by_num_edges_ilp = results.runway_quality_by_num_edges_ilp
    let runway_quality_by_density_ilp = results.runway_quality_by_density_ilp
    let runway_quality_by_max_degree_ilp = results.runway_quality_by_max_degree_ilp
    let runway_quality_by_avg_degree_ilp = results.runway_quality_by_avg_degree_ilp
    let staircase_quality_by_num_nodes_ilp = results.staircase_quality_by_num_nodes_ilp
    let staircase_quality_by_num_edges_ilp = results.staircase_quality_by_num_edges_ilp
    let staircase_quality_by_density_ilp = results.staircase_quality_by_density_ilp
    let staircase_quality_by_max_degree_ilp = results.staircase_quality_by_max_degree_ilp
    let staircase_quality_by_avg_degree_ilp = results.staircase_quality_by_avg_degree_ilp
    let difference_in_runway_quality_by_num_nodes = results.difference_in_runway_quality_by_num_nodes
    let difference_in_runway_quality_by_num_edges = results.difference_in_runway_quality_by_num_edges
    let difference_in_runway_quality_by_density = results.difference_in_runway_quality_by_density
    let difference_in_runway_quality_by_max_degree = results.difference_in_runway_quality_by_max_degree
    let difference_in_runway_quality_by_avg_degree = results.difference_in_runway_quality_by_avg_degree
    let difference_in_staircase_quality_by_num_nodes = results.difference_in_staircase_quality_by_num_nodes
    let difference_in_staircase_quality_by_num_edges = results.difference_in_staircase_quality_by_num_edges
    let difference_in_staircase_quality_by_density = results.difference_in_staircase_quality_by_density
    let difference_in_staircase_quality_by_max_degree = results.difference_in_staircase_quality_by_max_degree
    let difference_in_staircase_quality_by_avg_degree = results.difference_in_staircase_quality_by_avg_degree
    let ratio_in_staircase_quality_by_num_nodes = results.ratio_in_staircase_quality_by_num_nodes
    let ratio_in_staircase_quality_by_num_edges = results.ratio_in_staircase_quality_by_num_edges
    let ratio_in_staircase_quality_by_density = results.ratio_in_staircase_quality_by_density
    let ratio_in_staircase_quality_by_max_degree = results.ratio_in_staircase_quality_by_max_degree
    let ratio_in_staircase_quality_by_avg_degree = results.ratio_in_staircase_quality_by_avg_degree
    let ratio2_in_staircase_quality_by_num_nodes = results.ratio2_in_staircase_quality_by_num_nodes
    let ratio2_in_staircase_quality_by_num_edges = results.ratio2_in_staircase_quality_by_num_edges
    let ratio2_in_staircase_quality_by_density = results.ratio2_in_staircase_quality_by_density
    let ratio2_in_staircase_quality_by_max_degree = results.ratio2_in_staircase_quality_by_max_degree
    let ratio2_in_staircase_quality_by_avg_degree = results.ratio2_in_staircase_quality_by_avg_degree

    console.log("Total number of graphs: " + Object.values(total_num_graphs_by_num_nodes).reduce((a, b) => a + b))

    let maxnumnodes = 50 // Math.max.apply(0, Object.keys(time_by_num_nodes))
    let maxnumedges = 45 // Math.max.apply(0, Object.keys(time_by_num_edges))
    let minnumnodes = 10 // Math.min.apply(0, Object.keys(time_by_num_nodes))
    let minnumedges = 5 // Math.min.apply(0, Object.keys(time_by_num_edges))
    let mindensity = 0.05 // Math.min.apply(0, Object.keys(time_by_density))
    let maxdensity = 0.25 // Math.max.apply(0, Object.keys(time_by_density))
    let maxmaxdegree = 7 // Math.max.apply(0, Object.keys(time_by_max_degree))
    let minmaxdegree = 3 //Math.min.apply(0, Object.keys(time_by_max_degree))
    let maxrunwayquality = 10
    let maxrunwayqualitydifference = 5
    let maxstaircasequality = 10
    let maxstaircasequalitydifference = 5
    let maxratio = 4;
    let minratio = 0;

    let maxavgdegree = 3
    let minavgdegree = 1.7

    let mintime = 0
    let maxtime = 50 //Object.values(time_by_num_nodes).map(x => Math.max.apply(0, x)).reduce((a, b) => Math.max(a, b))

    // normalize timeouts
    for (let elem in timeouts_by_num_nodes) timeouts_by_num_nodes[elem] /= total_num_graphs_by_num_nodes[elem]
    for (let elem in timeouts_by_num_edges) timeouts_by_num_edges[elem] /= total_num_graphs_by_num_edges[elem]
    for (let elem in timeouts_by_density) timeouts_by_density[elem] /= total_num_graphs_by_density[elem]
    for (let elem in timeouts_by_max_degree) timeouts_by_max_degree[elem] /= total_num_graphs_by_max_degree[elem]
    for (let elem in timeouts_by_avg_degree) timeouts_by_avg_degree[elem] /= total_num_graphs_by_avg_degree[elem]
    console.log(timeouts_by_avg_degree)

    draw_scatterplot_with_median(scatterplot, [time_by_num_nodes], minnumnodes, maxnumnodes, mintime, maxtime, "Time to solve the problem by number of nodes", [d3.schemeTableau10[3]])
    draw_scatterplot_with_median(scatterplot, [time_by_num_edges], minnumedges, maxnumedges, mintime, maxtime, "Time to solve the problem by number of edges", [d3.schemeTableau10[3]])
    draw_scatterplot_with_median(scatterplot, [time_by_density], mindensity, maxdensity, mintime, maxtime, "Time to solve the problem by density", [d3.schemeTableau10[3]])
    draw_scatterplot_with_median(scatterplot, [time_by_max_degree], minmaxdegree, maxmaxdegree, mintime, maxtime, "Time to solve the problem by max degree", [d3.schemeTableau10[3]])
    draw_scatterplot_with_median(scatterplot, [time_by_avg_degree], minavgdegree, maxavgdegree, mintime, maxtime, "Time to solve the problem by avg degree", [d3.schemeTableau10[3]])

    draw_linechart_with_timeouts(scatterplot2, timeouts_by_num_nodes, minnumnodes, maxnumnodes, "Number of timeouts by number of nodes", [d3.schemeTableau10[2]])
    draw_linechart_with_timeouts(scatterplot2, timeouts_by_num_edges, minnumedges, maxnumedges, "Number of timeouts by number of edges", [d3.schemeTableau10[2]])
    draw_linechart_with_timeouts(scatterplot2, timeouts_by_density, mindensity, maxdensity, "Number of timeouts by density", [d3.schemeTableau10[2]])
    draw_linechart_with_timeouts(scatterplot2, timeouts_by_max_degree, minmaxdegree, maxmaxdegree, "Number of timeouts by max degree", [d3.schemeTableau10[2]])
    draw_linechart_with_timeouts(scatterplot2, timeouts_by_avg_degree, minavgdegree, maxavgdegree, "Number of timeouts by avg degree", [d3.schemeTableau10[2]])

    // draw the quality of the runways
    draw_scatterplot_with_median(scatterplot3, [runway_quality_by_num_nodes_degreecending, runway_quality_by_num_nodes_ilp], minnumnodes, maxnumnodes, 0, maxrunwayquality, "Quality of the runways by number of nodes")
    draw_scatterplot_with_median(scatterplot3, [runway_quality_by_num_edges_degreecending, runway_quality_by_num_edges_ilp], minnumedges, maxnumedges, 0, maxrunwayquality, "Quality of the runways by number of edges")
    draw_scatterplot_with_median(scatterplot3, [runway_quality_by_density_degreecending, runway_quality_by_density_ilp], mindensity, maxdensity, 0, maxrunwayquality, "Quality of the runways by density")
    draw_scatterplot_with_median(scatterplot3, [runway_quality_by_max_degree_degreecending, runway_quality_by_max_degree_ilp], minmaxdegree, maxmaxdegree, 0, maxrunwayquality, "Quality of the runways by max degree")
    draw_scatterplot_with_median(scatterplot3, [runway_quality_by_avg_degree_degreecending, runway_quality_by_avg_degree_ilp], minavgdegree, maxavgdegree, 0, maxrunwayquality, "Quality of the runways by avg degree")

    // draw the difference in quality of the runways
    draw_scatterplot_with_median(scatterplot4, [difference_in_runway_quality_by_num_nodes], minnumnodes, maxnumnodes, -maxrunwayqualitydifference, maxrunwayqualitydifference, "Difference in quality of the runways by number of nodes", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot4, [difference_in_runway_quality_by_num_edges], minnumedges, maxnumedges, -maxrunwayqualitydifference, maxrunwayqualitydifference, "Difference in quality of the runways by number of edges", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot4, [difference_in_runway_quality_by_density], mindensity, maxdensity, -maxrunwayqualitydifference, maxrunwayqualitydifference, "Difference in quality of the runways by density", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot4, [difference_in_runway_quality_by_max_degree], minmaxdegree, maxmaxdegree, -maxrunwayqualitydifference, maxrunwayqualitydifference, "Difference in quality of the runways by max degree", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot4, [difference_in_runway_quality_by_avg_degree], minavgdegree, maxavgdegree, -maxrunwayqualitydifference, maxrunwayqualitydifference, "Difference in quality of the runways by avg degree", [d3.schemeTableau10[4]])

    // draw the quality of the staircases
    draw_scatterplot_with_median(scatterplot5, [staircase_quality_by_num_nodes_degreecending, staircase_quality_by_num_nodes_ilp], minnumnodes, maxnumnodes, 0, maxstaircasequality, "Quality of the staircases by number of nodes")
    draw_scatterplot_with_median(scatterplot5, [staircase_quality_by_num_edges_degreecending, staircase_quality_by_num_edges_ilp], minnumedges, maxnumedges, 0, maxstaircasequality, "Quality of the staircases by number of edges")
    draw_scatterplot_with_median(scatterplot5, [staircase_quality_by_density_degreecending, staircase_quality_by_density_ilp], mindensity, maxdensity, 0, maxstaircasequality, "Quality of the staircases by density")
    draw_scatterplot_with_median(scatterplot5, [staircase_quality_by_max_degree_degreecending, staircase_quality_by_max_degree_ilp], minmaxdegree, maxmaxdegree, 0, maxstaircasequality, "Quality of the staircases by max degree")
    draw_scatterplot_with_median(scatterplot5, [staircase_quality_by_avg_degree_degreecending, staircase_quality_by_avg_degree_ilp], minavgdegree, maxavgdegree, 0, maxstaircasequality, "Quality of the staircases by avg degree")

    // draw the difference in quality of the staircases
    draw_scatterplot_with_median(scatterplot6, [difference_in_staircase_quality_by_num_nodes], minnumnodes, maxnumnodes, -maxstaircasequalitydifference, maxstaircasequalitydifference, "Difference in quality of the staircases by number of nodes", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot6, [difference_in_staircase_quality_by_num_edges], minnumedges, maxnumedges, -maxstaircasequalitydifference, maxstaircasequalitydifference, "Difference in quality of the staircases by number of edges", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot6, [difference_in_staircase_quality_by_density], mindensity, maxdensity, -maxstaircasequalitydifference, maxstaircasequalitydifference, "Difference in quality of the staircases by density", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot6, [difference_in_staircase_quality_by_max_degree], minmaxdegree, maxmaxdegree, -maxstaircasequalitydifference, maxstaircasequalitydifference, "Difference in quality of the staircases by max degree", [d3.schemeTableau10[4]])
    draw_scatterplot_with_median(scatterplot6, [difference_in_staircase_quality_by_avg_degree], minavgdegree, maxavgdegree, -maxstaircasequalitydifference, maxstaircasequalitydifference, "Difference in quality of the staircases by avg degree", [d3.schemeTableau10[4]])

    // draw the ratio in quality of the staircases
    draw_scatterplot_with_median(scatterplot7, [ratio_in_staircase_quality_by_num_nodes], minnumnodes, maxnumnodes, minratio, maxratio, "Ratio in quality of the staircases by number of nodes", [d3.schemeTableau10[5]])
    draw_scatterplot_with_median(scatterplot7, [ratio_in_staircase_quality_by_num_edges], minnumedges, maxnumedges, minratio, maxratio, "Ratio in quality of the staircases by number of edges", [d3.schemeTableau10[5]])
    draw_scatterplot_with_median(scatterplot7, [ratio_in_staircase_quality_by_density], mindensity, maxdensity, minratio, maxratio, "Ratio in quality of the staircases by density", [d3.schemeTableau10[5]])
    draw_scatterplot_with_median(scatterplot7, [ratio_in_staircase_quality_by_max_degree], minmaxdegree, maxmaxdegree, minratio, maxratio, "Ratio in quality of the staircases by max degree", [d3.schemeTableau10[5]])
    draw_scatterplot_with_median(scatterplot7, [ratio_in_staircase_quality_by_avg_degree], minavgdegree, maxavgdegree, minratio, maxratio, "Ratio in quality of the staircases by avg degree", [d3.schemeTableau10[5]])

    // draw the ratio2 in quality of the staircases
    draw_scatterplot_with_median(scatterplot8, [ratio2_in_staircase_quality_by_num_nodes], minnumnodes, maxnumnodes, minratio, maxratio, "Ratio2 in quality of the staircases by number of nodes", [d3.schemeTableau10[6]])
    draw_scatterplot_with_median(scatterplot8, [ratio2_in_staircase_quality_by_num_edges], minnumedges, maxnumedges, minratio, maxratio, "Ratio2 in quality of the staircases by number of edges", [d3.schemeTableau10[6]])
    draw_scatterplot_with_median(scatterplot8, [ratio2_in_staircase_quality_by_density], mindensity, maxdensity, minratio, maxratio, "Ratio2 in quality of the staircases by density", [d3.schemeTableau10[6]])
    draw_scatterplot_with_median(scatterplot8, [ratio2_in_staircase_quality_by_max_degree], minmaxdegree, maxmaxdegree, minratio, maxratio, "Ratio2 in quality of the staircases by max degree", [d3.schemeTableau10[6]])
    draw_scatterplot_with_median(scatterplot8, [ratio2_in_staircase_quality_by_avg_degree], minavgdegree, maxavgdegree, minratio, maxratio, "Ratio2 in quality of the staircases by avg degree", [d3.schemeTableau10[6]])

    draw_barchart(total_num_graphs_div, total_num_graphs_by_num_nodes, minnumnodes, maxnumnodes, "Total number of graphs by number of nodes", [d3.schemeTableau10[9]])
    draw_barchart(total_num_graphs_div, total_num_graphs_by_num_edges, minnumedges, maxnumedges, "Total number of graphs by number of edges", [d3.schemeTableau10[9]])
    draw_barchart(total_num_graphs_div, total_num_graphs_by_density, mindensity, maxdensity, "Total number of graphs by density", [d3.schemeTableau10[9]])
    draw_barchart(total_num_graphs_div, total_num_graphs_by_max_degree, minmaxdegree, maxmaxdegree, "Total number of graphs by max degree", [d3.schemeTableau10[9]])
    draw_barchart(total_num_graphs_div, total_num_graphs_by_avg_degree, minavgdegree, maxavgdegree, "Total number of graphs by avg degree", [d3.schemeTableau10[9]])

    draw_scatterplot_with_median(scatterplot9, [numconstraints_by_num_nodes], minnumnodes, maxnumnodes, 0, 60000, "Quality of the runways by number of nodes")
    draw_scatterplot_with_median(scatterplot9, [numconstraints_by_num_edges], minnumedges, maxnumedges, 0, 60000, "Quality of the runways by number of edges")
    draw_scatterplot_with_median(scatterplot9, [numconstraints_by_density], mindensity, maxdensity, 0, 60000, "Quality of the runways by density")
    draw_scatterplot_with_median(scatterplot9, [numconstraints_by_max_degree], minmaxdegree, maxmaxdegree, 0, 60000, "Quality of the runways by max degree")
    draw_scatterplot_with_median(scatterplot9, [numconstraints_by_avg_degree], minavgdegree, maxavgdegree, 0, 60000, "Quality of the runways by avg degree")

    draw_scatterplot_with_median(scatterplot9, [numvariables_by_num_nodes], minnumnodes, maxnumnodes, 0, 2000, "Quality of the runways by number of nodes")
    draw_scatterplot_with_median(scatterplot9, [numvariables_by_num_edges], minnumedges, maxnumedges, 0, 2000, "Quality of the runways by number of edges")
    draw_scatterplot_with_median(scatterplot9, [numvariables_by_density], mindensity, maxdensity, 0, 2000, "Quality of the runways by density")
    draw_scatterplot_with_median(scatterplot9, [numvariables_by_max_degree], minmaxdegree, maxmaxdegree, 0, 2000, "Quality of the runways by max degree")
    draw_scatterplot_with_median(scatterplot9, [numvariables_by_avg_degree], minavgdegree, maxavgdegree, 0, 2000, "Quality of the runways by avg degree")

}

function draw_barchart(parent_div, data, minval, maxval, title, colors){
    let maxy = Math.max.apply(0, Object.values(data))
    let keys = Object.keys(data).filter(x => x >= minval && x <= maxval)
    let height = 200
    let padding = {bottom: 25, top: 25}
    
    let barchart_svg = d3.select(parent_div).append("svg")
        .attr("width", "20%")  
        .attr("viewBox", "-30 0 510 " + height)

    let barchart_x = d3.scaleBand()
        .domain(keys)
        .range([50, 450])
        .padding(0)

    let barchart_y = d3.scaleLinear()
        .domain([0, maxy])
        .range([150, 0])

    maxy = 1.1 * maxy

    let axisbottom = barchart_svg.append("g")

    axisbottom.append("line")
        .attr("x1", 50)
        .attr("y1", height - padding.bottom)
        .attr("x2", 450)
        .attr("y2", height - padding.bottom)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")

    let axisleft = barchart_svg.append("g")

    axisleft.append("line")
        .attr("x1", 50)
        .attr("y1", padding.top)
        .attr("x2", 50)
        .attr("y2", height - padding.bottom)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")

    interval = maxy / 3

    for (let i = 0; i <= 1; i+= 0.33){
        if (i != 1 && i != 0) axisleft.append("line")
            .attr("x1", 50)
            .attr("y1", height - padding.bottom - i * (height - padding.bottom - padding.top))
            .attr("x2", 450)
            .attr("y2", height - padding.bottom - i * (height - padding.bottom - padding.top))
            .attr("stroke", "#dfdfdf")
            .attr("stroke-width", 8)
            .attr("stroke-linecap", "round")
            .style("stroke-dasharray", "10 15")

        axisleft.append("text")
            .attr("x", 37)
            .attr("y", height - padding.bottom - i * (height - padding.bottom - padding.top) + 8)
            .attr("text-anchor", "end")
            .attr("font-size", "22px")
            .attr("fill", "gray")
            .text(Math.round(i*maxy))
    }

    barchart_svg.selectAll("rect")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", (d) => barchart_x(d))
        .attr("y", (d) => barchart_y(data[d]) + padding.top)
        .attr("width", barchart_x.bandwidth())
        .attr("height", (d) => height - barchart_y(data[d]) - padding.top - padding.bottom)
        .attr("fill", colors[0])

    barchart_svg.selectAll("text").attr("font-size", "30px")
}

function draw_scatterplot_with_median(scatterplot, datapoints, minnumnodes, maxnumnodes, mintime, maxtime, title, colors){
    let scatterplot_svg = d3.select(scatterplot).append("svg")
      .attr("width", "20%")  
      .attr("viewBox", "-30 0 510 500")

    let scatterplot_x = d3.scaleLinear()
        .domain([minnumnodes, maxnumnodes])
        .range([50, 450])

    let scatterplot_y = d3.scaleLinear()
        .domain([mintime, maxtime])
        .range([450, 50])

    if (colors == undefined){
        colors = ["steelblue", "orange"]
    }

        // // draw the axes, with only 5 ticks and big font
    // scatterplot_svg.append("g")
    //     .attr("transform", "translate(0,450)")
    //     .call(d3.axisBottom(scatterplot_x).ticks(3))

    let axisbottom = scatterplot_svg.append("g")
    axisbottom.append("line")
        .attr("x1", 50)
        .attr("y1", 450)
        .attr("x2", 450)
        .attr("y2", 450)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")

    let interval = (scatterplot_x.domain()[1] - scatterplot_x.domain()[0]) / 4
    for (let i = scatterplot_x.domain()[0] + interval; i <= scatterplot_x.domain()[1]; i+= interval){
        if (i != scatterplot_x.domain()[1]) axisbottom.append("line")
            .attr("x1", scatterplot_x(i))
            .attr("y1", 50)
            .attr("x2", scatterplot_x(i))
            .attr("y2", 450)
            .attr("stroke", "#dfdfdf")
            .attr("stroke-width", 8)
            .attr("stroke-linecap", "round")
            .style("stroke-dasharray", "10 15")

        axisbottom.append("text")
            .attr("x", scatterplot_x(i))
            .attr("y", 488)
            .attr("text-anchor", "middle")
            .attr("font-size", "60 px")
            .attr("fill", "gray")
            .text(Math.round(i*100)/100)
    }

    // do the same for the vertical axis
    let axisleft = scatterplot_svg.append("g")
    axisleft.append("line")
        .attr("x1", 50)
        .attr("y1", 50)
        .attr("x2", 50)
        .attr("y2", 450)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")

    interval = (scatterplot_y.domain()[1] - scatterplot_y.domain()[0]) / 4
    for (let i = scatterplot_y.domain()[0] + interval; i <= scatterplot_y.domain()[1]; i+= interval){
        if (i != scatterplot_y.domain()[1]) axisleft.append("line")
            .attr("x1", 50)
            .attr("y1", scatterplot_y(i))
            .attr("x2", 450)
            .attr("y2", scatterplot_y(i))
            .attr("stroke", "#dfdfdf")
            .attr("stroke-width", 8)
            .attr("stroke-linecap", "round")
            .style("stroke-dasharray", "10 15")

        axisleft.append("text")
            .attr("x", 37)
            .attr("y", scatterplot_y(i) + 8)
            .attr("text-anchor", "end")
            .attr("font-size", "26px")
            .attr("fill", "gray")
            .text(Math.round(i*100)/100)
    }

    let circleg = scatterplot_svg.append("g")
        .attr("opacity", 0.7)

    let total_avg = 0
    for (let datapoint of datapoints){
        let colorindex = datapoints.indexOf(datapoint)
        let medianvalues = {}

        let occupied_positions = {}

        for (let numnodes in datapoint){
            if (numnodes > maxnumnodes) continue;
            if (numnodes < minnumnodes) continue;
            if (datapoint[numnodes].length == 0) continue;
            for (let time of datapoint[numnodes]){
                if (time >= maxtime) continue;
                if (time < mintime) continue;
                total_avg += time

                let check_scatterplot_y = Math.round(scatterplot_y(time)/20)*20

                if (occupied_positions[numnodes + "_" + check_scatterplot_y] == undefined) occupied_positions[numnodes + "_" + check_scatterplot_y] = 0
                occupied_positions[numnodes + "_" + check_scatterplot_y] += 1

                if (occupied_positions[numnodes + "_" + check_scatterplot_y] < 5){
                    // if (time >= 1)
                    circleg.append("circle")
                    .attr("cx", scatterplot_x(numnodes))
                    .attr("cy", scatterplot_y(time))
                    .attr("r", 10)
                    .attr("stroke", colors[colorindex])
                    .attr("fill", "none")
                    .attr("stroke-width", 5)
                    .style("opacity", 0.5)
                }
            }

            // compute the median
            let median = d3.median(datapoint[numnodes])
            medianvalues[numnodes] = median
        }
        console.log("avg for", title, total_avg / Object.values(datapoint).flat().length)
        console.log(Object.keys(occupied_positions).length, occupied_positions)

        let medianline = []
        let arr = Object.keys(datapoint).map(n => parseFloat(n)).sort((a, b) => a - b)
        for (let numnodes of arr){
            numnodes = parseFloat(numnodes)
            if (numnodes > maxnumnodes) continue;
            if (numnodes < minnumnodes) continue;
            // if (scatterplot_y(medianvalues[numnodes]) == undefined) continue;
            medianline.push([scatterplot_x(numnodes), scatterplot_y(parseFloat(medianvalues[numnodes]))])
            // console.log(scatterplot_y(medianvalues[numnodes]))
        }

        scatterplot_svg.append("path")
            .attr("d", d3.line()(medianline))
            .attr("stroke", "white")
            .attr("stroke-width", 20)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
        
        // draw the median line
        scatterplot_svg.append("path")
            .attr("d", d3.line()(medianline))
            .attr("stroke", colors[colorindex])
            .attr("stroke-width", 11)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
    }

    // scatterplot_svg.append("g")
    //     .attr("transform", "translate(50,0)")
    //     .call(d3.axisLeft(scatterplot_y).ticks(3))

    // make the font of the ticks bigger
    scatterplot_svg.selectAll("text")
        .attr("font-size", "30px")

    // give a title to the scatterplot
    // scatterplot_svg.append("text")
    //     .attr("x", 250)
    //     .attr("y", 20)
    //     .attr("text-anchor", "middle")
    //     .attr("font-size", "20px")
    //     .text(title)
}

function draw_linechart_with_timeouts(stats2, timeouts_by_num_nodes, minnumnodes, maxnumnodes, title, colors){
    let linechart = d3.select(stats2).append("svg")
      .attr("width", "20%")  
      .attr("viewBox", "-30 0 510 500")

    let linechart_x = d3.scaleLinear()
        .domain([minnumnodes, maxnumnodes])
        .range([50, 450])

    let linechart_y = d3.scaleLinear()
        .domain([0, 1])
        .range([450, 50])

    let axisbottom = linechart.append("g")
    axisbottom.append("line")
        .attr("x1", 50)
        .attr("y1", 450)
        .attr("x2", 450)
        .attr("y2", 450)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")

    let interval = (linechart_x.domain()[1] - linechart_x.domain()[0]) / 4
    for (let i = linechart_x.domain()[0] + interval; i <= linechart_x.domain()[1]; i+= interval){
        if (i != linechart_x.domain()[1]) axisbottom.append("line")
            .attr("x1", linechart_x(i))
            .attr("y1", 50)
            .attr("x2", linechart_x(i))
            .attr("y2", 450)
            .attr("stroke", "#dfdfdf")
            .attr("stroke-width", 8)
            .attr("stroke-linecap", "round")
            .style("stroke-dasharray", "10 15")

        axisbottom.append("text")
            .attr("x", linechart_x(i))
            .attr("y", 488)
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            .attr("fill", "gray")
            .text(Math.round(i*100)/100)
    }

    // do the same for the vertical axis
    let axisleft = linechart.append("g")
    axisleft.append("line")
        .attr("x1", 50)
        .attr("y1", 50)
        .attr("x2", 50)
        .attr("y2", 450)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")

    interval = (linechart_y.domain()[1] - linechart_y.domain()[0]) / 4
    for (let i = linechart_y.domain()[0] + interval; i <= linechart_y.domain()[1]; i+= interval){
        if (i != linechart_y.domain()[1]) axisleft.append("line")
            .attr("x1", 50)
            .attr("y1", linechart_y(i))
            .attr("x2", 450)
            .attr("y2", linechart_y(i))
            .attr("stroke", "#dfdfdf")
            .attr("stroke-width", 8)
            .attr("stroke-linecap", "round")
            .style("stroke-dasharray", "10 15")

        axisleft.append("text")
            .attr("x", 37)
            .attr("y", linechart_y(i) + 8)
            .attr("text-anchor", "end")
            .attr("font-size", "22px")
            .attr("fill", "gray")
            .text(Math.round(i*100)/100)
    }

    if (colors == undefined){
        colors = ["steelblue", "orange"]
    }

    let linechart_data = []
    let arr = Object.keys(timeouts_by_num_nodes).map(x => parseFloat(x)).sort((a, b) => a - b)
    for (let numnodes of arr){
        if (numnodes > maxnumnodes || numnodes < minnumnodes) continue;
        linechart_data.push([linechart_x(numnodes), linechart_y(timeouts_by_num_nodes[numnodes])])
    }

    linechart.append("path")
        .attr("d", d3.line()(linechart_data))
        .attr("stroke", "white")
        .attr("stroke-width", 20)
        .attr("fill", "none")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")

    linechart.append("path")
        .attr("d", d3.line()(linechart_data))
        .attr("stroke", colors[0])
        .attr("stroke-width", 8)
        .attr("fill", "none")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")

    // // draw the axes
    // linechart.append("g")
    //     .attr("transform", "translate(0,450)")
    //     .call(d3.axisBottom(linechart_x).ticks(3))

    // linechart.append("g")
    //     .attr("transform", "translate(50,0)")
    //     .call(d3.axisLeft(linechart_y).ticks(3))

    // make the font of the ticks bigger
    linechart.selectAll("text")
        .attr("font-size", "30px")

    // give a title to the scatterplot
    // linechart.append("text")
    //     .attr("x", 250)
    //     .attr("y", 20)
    //     .attr("text-anchor", "middle")
    //     .attr("font-size", "20px")
    //     .text(title)
}