const fs = require('fs');
const path = require('path');

eval(fs.readFileSync('js/heuristics.js')+'');
eval(fs.readFileSync('js/biofabric_lp.js')+'');
eval(fs.readFileSync('js/analyzeGraph.js')+'');
eval(fs.readFileSync('js/helpers/runwayHelper.js')+'');
eval(fs.readFileSync('js/helpers/stairsHelper.js')+'');

let options = require('./options.js').options;
let Biofabric_lp = require('./biofabric_lp.js'); 

const directoryPath = path.join(__dirname, '../' + options.solution_folder +'');

let results = {};

let exclude_timeouts_from_median_scatterplots = true;

let time_by_num_nodes = {}
let time_by_num_edges = {}
let time_by_density = {}
let time_by_max_degree = {}
let time_by_avg_degree = {}
let timeouts_by_num_nodes = {}
let timeouts_by_num_edges = {}
let timeouts_by_density = {}
let timeouts_by_max_degree = {}
let timeouts_by_avg_degree = {}
let numconstraints_by_num_nodes = {}
let numconstraints_by_num_edges = {}
let numconstraints_by_density = {}
let numconstraints_by_max_degree = {}
let numconstraints_by_avg_degree = {}
let numvariables_by_num_nodes = {}
let numvariables_by_num_edges = {}
let numvariables_by_density = {}
let numvariables_by_max_degree = {}
let numvariables_by_avg_degree = {}
let total_num_graphs_by_num_nodes = {}
let total_num_graphs_by_num_edges = {}
let total_num_graphs_by_density = {}
let total_num_graphs_by_max_degree = {}
let total_num_graphs_by_avg_degree = {}
let runway_quality_by_num_nodes_degreecending = {}
let runway_quality_by_num_edges_degreecending = {}
let runway_quality_by_density_degreecending = {}
let runway_quality_by_max_degree_degreecending = {}
let runway_quality_by_avg_degree_degreecending = {}
let staircase_quality_by_num_nodes_degreecending = {}
let staircase_quality_by_num_edges_degreecending = {}
let staircase_quality_by_density_degreecending = {}
let staircase_quality_by_max_degree_degreecending = {}
let staircase_quality_by_avg_degree_degreecending = {}
let runway_quality_by_num_nodes_ilp = {}
let runway_quality_by_num_edges_ilp = {}
let runway_quality_by_density_ilp = {}
let runway_quality_by_max_degree_ilp = {}
let runway_quality_by_avg_degree_ilp = {}
let staircase_quality_by_num_nodes_ilp = {}
let staircase_quality_by_num_edges_ilp = {}
let staircase_quality_by_density_ilp = {}
let staircase_quality_by_max_degree_ilp = {}
let staircase_quality_by_avg_degree_ilp = {}
let difference_in_runway_quality_by_num_nodes = {}
let difference_in_runway_quality_by_num_edges = {}
let difference_in_runway_quality_by_density = {}
let difference_in_runway_quality_by_max_degree = {}
let difference_in_runway_quality_by_avg_degree = {}
let difference_in_staircase_quality_by_num_nodes = {}
let difference_in_staircase_quality_by_num_edges = {}
let difference_in_staircase_quality_by_density = {}
let difference_in_staircase_quality_by_max_degree = {}
let difference_in_staircase_quality_by_avg_degree = {}
let ratio_in_staircase_quality_by_num_nodes = {}
let ratio_in_staircase_quality_by_num_edges = {}
let ratio_in_staircase_quality_by_density = {}
let ratio_in_staircase_quality_by_max_degree = {}
let ratio_in_staircase_quality_by_avg_degree = {}
let ratio2_in_staircase_quality_by_num_nodes = {}
let ratio2_in_staircase_quality_by_num_edges = {}
let ratio2_in_staircase_quality_by_density = {}
let ratio2_in_staircase_quality_by_max_degree = {}
let ratio2_in_staircase_quality_by_avg_degree = {}
let ratio_by_filename = {}

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 

    files.forEach((file) => {
        if (file.includes(".sol")) return;

        const filePath = path.join(directoryPath, file);
        const readFile1 = new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject('Unable to read file: ' + err);
            } else {
                // console.log(`Content of ${file}:`);
                resolve(data);
            }
            });
        });

        const filePath2 = path.join(__dirname, "../data/rome-lib/", file.replace(".log", ".json"));
        const readFile2 = new Promise((resolve, reject) => {
            fs.readFile(filePath2, 'utf8', (err, data) => {
            if (err) {
                reject('Unable to read file: ' + err);
            } else {
                // console.log(`Content of ${file}:`);
                resolve(data);
            }
            });
        });

        const filePath3 = path.join(__dirname, "../" + options.solution_folder + "/", file.replace(".log", ".sol"));
        const readFile3 = new Promise((resolve, reject) => {
            fs.readFile(filePath3, 'utf8', (err, data) => {
            if (err) {
                reject('Unable to read file: ' + err);
            } else {
                // console.log(`Content of ${file}:`);
                resolve(data);
            }
            });
        });

        Promise.all([readFile1, readFile2, readFile3])
            .then((values) => {
            // Both files have been read successfully
            let [data1, data2, data3] = values;
                // read data2 as json
                data2 = JSON.parse(data2)
                process_data(data1, data2, data3, file);
            })
            .catch((error) => {
            console.log(error);
            });
    });
});

async function process_data(r2log, r, sol, filename) {

    if (filename.includes("grafo11311.40")) return;
    
    // find in r2log the time it took to solve the problem
    let time = r2log.split("\n").filter(x => x.includes("seconds"))[2]
    if (time == undefined) {console.log(filename); return;}
    // make a regex to find the number right before the word "seconds"
    time = parseFloat(time.match(/\d+\.\d+/)[0])

    // find the line in r2log that starts with ":"
    let line = r2log.split("\n").filter(x => x[0] == ":")[0]
    // make a regex to find the first number
    let numconstraints = parseInt(line.match(/\d+/)[0])
    // make a regex to find the second number
    let numvariables = parseInt(line.match(/\d+/g)[1])

    // compute density of the graph, approximated to the second decimal
    let density = r.links.length / (r.nodes.length * (r.nodes.length - 1) / 2)
    density = Math.round(density * 100) / 100

    // compute max degree of the graph
    let degrees = r.nodes.map(n => r.links.filter(e => e.source == n.id || e.target == n.id).length)
    let max_degree = Math.max.apply(0, degrees)
    let average_degree = Math.round(degrees.reduce((a, b) => a + b, 0) / degrees.length * 10)/10

    // if the number of nodes is not in the dictionary, add it
    if (!(r.nodes.length in total_num_graphs_by_num_nodes)) total_num_graphs_by_num_nodes[r.nodes.length] = 0
    if (!(r.links.length in total_num_graphs_by_num_edges)) total_num_graphs_by_num_edges[r.links.length] = 0
    if (!(density in total_num_graphs_by_density)) total_num_graphs_by_density[density] = 0
    if (!(max_degree in total_num_graphs_by_max_degree)) total_num_graphs_by_max_degree[max_degree] = 0   
    if (!(average_degree in total_num_graphs_by_avg_degree)) total_num_graphs_by_avg_degree[average_degree] = 0 

    total_num_graphs_by_num_nodes[r.nodes.length] += 1
    total_num_graphs_by_num_edges[r.links.length] += 1
    total_num_graphs_by_density[density] += 1
    total_num_graphs_by_max_degree[max_degree] += 1
    total_num_graphs_by_avg_degree[average_degree] += 1

    if (r2log.includes("Time limit reached")){
        if (timeouts_by_num_nodes[r.nodes.length] == undefined) timeouts_by_num_nodes[r.nodes.length] = 0
        if (timeouts_by_num_edges[r.links.length] == undefined) timeouts_by_num_edges[r.links.length] = 0
        if (timeouts_by_density[density] == undefined) timeouts_by_density[density] = 0
        if (timeouts_by_max_degree[max_degree] == undefined) timeouts_by_max_degree[max_degree] = 0
        if (timeouts_by_avg_degree[average_degree] == undefined) timeouts_by_avg_degree[average_degree] = 0
        timeouts_by_num_nodes[r.nodes.length] += 1
        timeouts_by_num_edges[r.links.length] += 1
        timeouts_by_density[density] += 1
        timeouts_by_max_degree[max_degree] += 1
        timeouts_by_avg_degree[average_degree] += 1
        if (exclude_timeouts_from_median_scatterplots) return;
    }

    if (!(r.nodes.length in numconstraints_by_num_nodes)) numconstraints_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in numconstraints_by_num_edges)) numconstraints_by_num_edges[r.links.length] = []
    if (!(density in numconstraints_by_density)) numconstraints_by_density[density] = []
    if (!(max_degree in numconstraints_by_max_degree)) numconstraints_by_max_degree[max_degree] = []
    if (!(average_degree in numconstraints_by_avg_degree)) numconstraints_by_avg_degree[average_degree] = []

    numconstraints_by_num_nodes[r.nodes.length].push(numconstraints)
    numconstraints_by_num_edges[r.links.length].push(numconstraints)
    numconstraints_by_density[density].push(numconstraints)
    numconstraints_by_max_degree[max_degree].push(numconstraints)
    numconstraints_by_avg_degree[average_degree].push(numconstraints)

    if (!(r.nodes.length in numvariables_by_num_nodes)) numvariables_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in numvariables_by_num_edges)) numvariables_by_num_edges[r.links.length] = []
    if (!(density in numvariables_by_density)) numvariables_by_density[density] = []
    if (!(max_degree in numvariables_by_max_degree)) numvariables_by_max_degree[max_degree] = []
    if (!(average_degree in numvariables_by_avg_degree)) numvariables_by_avg_degree[average_degree] = []

    numvariables_by_num_nodes[r.nodes.length].push(numvariables)
    numvariables_by_num_edges[r.links.length].push(numvariables)
    numvariables_by_density[density].push(numvariables)
    numvariables_by_max_degree[max_degree].push(numvariables)
    numvariables_by_avg_degree[average_degree].push(numvariables)

    // if the number of nodes is not in the dictionary, add it
    if (!(r.nodes.length in time_by_num_nodes))time_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in time_by_num_edges))time_by_num_edges[r.links.length] = []
    if (!(density in time_by_density))time_by_density[density] = []
    if (!(max_degree in time_by_max_degree))time_by_max_degree[max_degree] = []
    if (!(average_degree in time_by_avg_degree))time_by_avg_degree[average_degree] = []

    time_by_num_nodes[r.nodes.length].push(time)
    time_by_num_edges[r.links.length].push(time)
    time_by_density[density].push(time)
    time_by_max_degree[max_degree].push(time)
    time_by_avg_degree[average_degree].push(time)

    // compute degreecending quality 
    let degreecending_time = new Date().getTime()
    sortByDegree(r.nodes, r.links)
    sortForStaircases(r.nodes, r.links)
    let degreecendingquality = analyzeGraph(r.nodes, r.links)
    degreecending_time = new Date().getTime() - degreecending_time
    console.log(degreecending_time)

    if (!(r.nodes.length in runway_quality_by_num_nodes_degreecending)) runway_quality_by_num_nodes_degreecending[r.nodes.length] = []
    if (!(r.links.length in runway_quality_by_num_edges_degreecending)) runway_quality_by_num_edges_degreecending[r.links.length] = []
    if (!(density in runway_quality_by_density_degreecending)) runway_quality_by_density_degreecending[density] = []
    if (!(max_degree in runway_quality_by_max_degree_degreecending)) runway_quality_by_max_degree_degreecending[max_degree] = []
    if (!(average_degree in runway_quality_by_avg_degree_degreecending)) runway_quality_by_avg_degree_degreecending[average_degree] = []

    runway_quality_by_num_nodes_degreecending[r.nodes.length].push(degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_num_edges_degreecending[r.links.length].push(degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_density_degreecending[density].push(degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_max_degree_degreecending[max_degree].push(degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_avg_degree_degreecending[average_degree].push(degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))

    if (!(r.nodes.length in staircase_quality_by_num_nodes_degreecending)) staircase_quality_by_num_nodes_degreecending[r.nodes.length] = []
    if (!(r.links.length in staircase_quality_by_num_edges_degreecending)) staircase_quality_by_num_edges_degreecending[r.links.length] = []
    if (!(density in staircase_quality_by_density_degreecending)) staircase_quality_by_density_degreecending[density] = []
    if (!(max_degree in staircase_quality_by_max_degree_degreecending)) staircase_quality_by_max_degree_degreecending[max_degree] = []
    if (!(average_degree in staircase_quality_by_avg_degree_degreecending)) staircase_quality_by_avg_degree_degreecending[average_degree] = []

    staircase_quality_by_num_nodes_degreecending[r.nodes.length].push(degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_num_edges_degreecending[r.links.length].push(degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_density_degreecending[density].push(degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_max_degree_degreecending[max_degree].push(degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_avg_degree_degreecending[average_degree].push(degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))

    let lp = new Biofabric_lp(r, options);
    lp.result = {};

    for (let i in sol.split("\n")){
        const match = sol.split("\n")[i].split(" ")
        lp.result[match[0]] = parseFloat(match[1])
    }
    lp.apply_solution(options);

    let ilpquality = analyzeGraph(r.nodes, r.links, lp)

    if (!(r.nodes.length in runway_quality_by_num_nodes_ilp)) runway_quality_by_num_nodes_ilp[r.nodes.length] = []
    if (!(r.links.length in runway_quality_by_num_edges_ilp)) runway_quality_by_num_edges_ilp[r.links.length] = []
    if (!(density in runway_quality_by_density_ilp)) runway_quality_by_density_ilp[density] = []
    if (!(max_degree in runway_quality_by_max_degree_ilp)) runway_quality_by_max_degree_ilp[max_degree] = []
    if (!(average_degree in runway_quality_by_avg_degree_ilp)) runway_quality_by_avg_degree_ilp[average_degree] = []

    runway_quality_by_num_nodes_ilp[r.nodes.length].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_num_edges_ilp[r.links.length].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_density_ilp[density].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_max_degree_ilp[max_degree].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0))
    runway_quality_by_avg_degree_ilp[average_degree].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0))

    if (!(r.nodes.length in staircase_quality_by_num_nodes_ilp)) staircase_quality_by_num_nodes_ilp[r.nodes.length] = []
    if (!(r.links.length in staircase_quality_by_num_edges_ilp)) staircase_quality_by_num_edges_ilp[r.links.length] = []
    if (!(density in staircase_quality_by_density_ilp)) staircase_quality_by_density_ilp[density] = []
    if (!(max_degree in staircase_quality_by_max_degree_ilp)) staircase_quality_by_max_degree_ilp[max_degree] = []
    if (!(average_degree in staircase_quality_by_avg_degree_ilp)) staircase_quality_by_avg_degree_ilp[average_degree] = []

    staircase_quality_by_num_nodes_ilp[r.nodes.length].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_num_edges_ilp[r.links.length].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_density_ilp[density].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_max_degree_ilp[max_degree].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    staircase_quality_by_avg_degree_ilp[average_degree].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))

    // compute difference in runway quality
    if (!(r.nodes.length in difference_in_runway_quality_by_num_nodes)) difference_in_runway_quality_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in difference_in_runway_quality_by_num_edges)) difference_in_runway_quality_by_num_edges[r.links.length] = []
    if (!(density in difference_in_runway_quality_by_density)) difference_in_runway_quality_by_density[density] = []
    if (!(max_degree in difference_in_runway_quality_by_max_degree)) difference_in_runway_quality_by_max_degree[max_degree] = []
    if (!(average_degree in difference_in_runway_quality_by_avg_degree)) difference_in_runway_quality_by_avg_degree[average_degree] = []

    difference_in_runway_quality_by_num_nodes[r.nodes.length].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0) - degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    difference_in_runway_quality_by_num_edges[r.links.length].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0) - degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    difference_in_runway_quality_by_density[density].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0) - degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    difference_in_runway_quality_by_max_degree[max_degree].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0) - degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))
    difference_in_runway_quality_by_avg_degree[average_degree].push(ilpquality.runwayQualities.reduce((a, b) => a + b, 0) - degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0))

    // compute difference in staircase quality
    if (!(r.nodes.length in difference_in_staircase_quality_by_num_nodes)) difference_in_staircase_quality_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in difference_in_staircase_quality_by_num_edges)) difference_in_staircase_quality_by_num_edges[r.links.length] = []
    if (!(density in difference_in_staircase_quality_by_density)) difference_in_staircase_quality_by_density[density] = []
    if (!(max_degree in difference_in_staircase_quality_by_max_degree)) difference_in_staircase_quality_by_max_degree[max_degree] = []
    if (!(average_degree in difference_in_staircase_quality_by_avg_degree)) difference_in_staircase_quality_by_avg_degree[average_degree] = []

    difference_in_staircase_quality_by_num_nodes[r.nodes.length].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) - degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    difference_in_staircase_quality_by_num_edges[r.links.length].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) - degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    difference_in_staircase_quality_by_density[density].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) - degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    difference_in_staircase_quality_by_max_degree[max_degree].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) - degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    difference_in_staircase_quality_by_avg_degree[average_degree].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) - degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))

    // compute ratio in staircase quality
    if (!(r.nodes.length in ratio_in_staircase_quality_by_num_nodes)) ratio_in_staircase_quality_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in ratio_in_staircase_quality_by_num_edges)) ratio_in_staircase_quality_by_num_edges[r.links.length] = []
    if (!(density in ratio_in_staircase_quality_by_density)) ratio_in_staircase_quality_by_density[density] = []
    if (!(max_degree in ratio_in_staircase_quality_by_max_degree)) ratio_in_staircase_quality_by_max_degree[max_degree] = []
    if (!(average_degree in ratio_in_staircase_quality_by_avg_degree)) ratio_in_staircase_quality_by_avg_degree[average_degree] = []

    ratio_in_staircase_quality_by_num_nodes[r.nodes.length].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) / degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    ratio_in_staircase_quality_by_num_edges[r.links.length].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) / degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    ratio_in_staircase_quality_by_density[density].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) / degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    ratio_in_staircase_quality_by_max_degree[max_degree].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) / degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))
    ratio_in_staircase_quality_by_avg_degree[average_degree].push(ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) / degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0))

    // compute ratio2 in staircase quality
    if (!(r.nodes.length in ratio2_in_staircase_quality_by_num_nodes)) ratio2_in_staircase_quality_by_num_nodes[r.nodes.length] = []
    if (!(r.links.length in ratio2_in_staircase_quality_by_num_edges)) ratio2_in_staircase_quality_by_num_edges[r.links.length] = []
    if (!(density in ratio2_in_staircase_quality_by_density)) ratio2_in_staircase_quality_by_density[density] = []
    if (!(max_degree in ratio2_in_staircase_quality_by_max_degree)) ratio2_in_staircase_quality_by_max_degree[max_degree] = []
    if (!(average_degree in ratio2_in_staircase_quality_by_avg_degree)) ratio2_in_staircase_quality_by_avg_degree[average_degree] = []

    ratio2_in_staircase_quality_by_num_nodes[r.nodes.length].push(ilpquality.stairQualities2 / degreecendingquality.stairQualities2)
    ratio2_in_staircase_quality_by_num_edges[r.links.length].push(ilpquality.stairQualities2 / degreecendingquality.stairQualities2)
    ratio2_in_staircase_quality_by_density[density].push(ilpquality.stairQualities2 / degreecendingquality.stairQualities2)
    ratio2_in_staircase_quality_by_max_degree[max_degree].push(ilpquality.stairQualities2 / degreecendingquality.stairQualities2)
    ratio2_in_staircase_quality_by_avg_degree[average_degree].push(ilpquality.stairQualities2 / degreecendingquality.stairQualities2)

    if (!(filename in ratio_by_filename)) ratio_by_filename[filename] = {}
    ratio_by_filename[filename] = {
        runway: ilpquality.runwayQualities.reduce((a, b) => a + b, 0) / degreecendingquality.runwayQualities.reduce((a, b) => a + b, 0),
        staircase: ilpquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0) / degreecendingquality.stairQualities.slice(0, -1).map(s => Math.round(s[0] * 100)/100).reduce((a, b) => a + b, 0)
    }


    // print the 
const output = {
    time_by_num_nodes,
    time_by_num_edges,
    time_by_density,
    time_by_max_degree,
    time_by_avg_degree,
    timeouts_by_num_nodes,
    timeouts_by_num_edges,
    timeouts_by_density,
    timeouts_by_max_degree,
    timeouts_by_avg_degree,
    numconstraints_by_num_nodes,
    numconstraints_by_num_edges,
    numconstraints_by_density,
    numconstraints_by_max_degree,
    numconstraints_by_avg_degree,
    numvariables_by_num_nodes,
    numvariables_by_num_edges,
    numvariables_by_density,
    numvariables_by_max_degree,
    numvariables_by_avg_degree,
    total_num_graphs_by_num_nodes,
    total_num_graphs_by_num_edges,
    total_num_graphs_by_density,
    total_num_graphs_by_max_degree,
    total_num_graphs_by_avg_degree,
    runway_quality_by_num_nodes_degreecending,
    runway_quality_by_num_edges_degreecending,
    runway_quality_by_density_degreecending,
    runway_quality_by_max_degree_degreecending,
    runway_quality_by_avg_degree_degreecending,
    staircase_quality_by_num_nodes_degreecending,
    staircase_quality_by_num_edges_degreecending,
    staircase_quality_by_density_degreecending,
    staircase_quality_by_max_degree_degreecending,
    staircase_quality_by_avg_degree_degreecending,
    runway_quality_by_num_nodes_ilp,
    runway_quality_by_num_edges_ilp,
    runway_quality_by_density_ilp,
    runway_quality_by_max_degree_ilp,
    runway_quality_by_avg_degree_ilp,
    staircase_quality_by_num_nodes_ilp,
    staircase_quality_by_num_edges_ilp,
    staircase_quality_by_density_ilp,
    staircase_quality_by_max_degree_ilp,
    staircase_quality_by_avg_degree_ilp,
    difference_in_runway_quality_by_num_nodes,
    difference_in_runway_quality_by_num_edges,
    difference_in_runway_quality_by_density,
    difference_in_runway_quality_by_max_degree,
    difference_in_runway_quality_by_avg_degree,
    difference_in_staircase_quality_by_num_nodes,
    difference_in_staircase_quality_by_num_edges,
    difference_in_staircase_quality_by_density,
    difference_in_staircase_quality_by_max_degree,
    difference_in_staircase_quality_by_avg_degree,
    ratio_in_staircase_quality_by_num_nodes,
    ratio_in_staircase_quality_by_num_edges,
    ratio_in_staircase_quality_by_density,
    ratio_in_staircase_quality_by_max_degree,
    ratio_in_staircase_quality_by_avg_degree,
    ratio2_in_staircase_quality_by_num_nodes,
    ratio2_in_staircase_quality_by_num_edges,
    ratio2_in_staircase_quality_by_density,
    ratio2_in_staircase_quality_by_max_degree,
    ratio2_in_staircase_quality_by_avg_degree,
    ratio_by_filename
};

fs.writeFileSync('' + options.solution_folder + '/organized_results.json', JSON.stringify(output, null, 2));
}