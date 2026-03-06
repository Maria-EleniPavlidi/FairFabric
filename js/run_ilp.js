let fs = require('fs');
eval(fs.readFileSync('js/util.js')+'');
var exec = require('child_process').exec, child;
let Biofabric_lp = require('./biofabric_lp.js'); 
let Biofabric_lp_zachary = require('./biofabric_lp_zachary.js');
let Biofabric_lp_raccoon = require('./biofabric_lp_raccoon.js');
let sortByDegree = require('./heuristics.js').sortByDegree;
let sortForStaircases = require('./heuristics.js').sortForStaircases;

// import options.js
let options = require('./options.js').options;

let solver_in_use = "gurobi"; // gurobi or glpk

async function sh(cmd) {
    return new Promise(function (resolve, reject) {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
}

async function solve_one_graph(file, i){
    let startTime = new Date().getTime()
    if (solver_in_use == "glpk"){
        let { stdout } = await sh("glpsol --lp ./" + options.problem_folder + "/" + file.replace("json", "lp") + " --cuts --tmlim 10 -o ./" + options.solution_folder + "/" + file.replace(".json", ".sol"))
    } else if (solver_in_use == "gurobi"){
        let { stdout } = await sh("gurobi_cl TimeLimit=" + options.timeout_value + " ResultFile=./" + options.solution_folder + "/" + file.replace("json", "sol") + " LogFile=./" + options.solution_folder + "/" + file.replace("json", "log") + " ./" + options.problem_folder + "/" + file.replace("json", "lp"))
    }
    console.log("Time to solve (" + i + ") " , file, new Date().getTime() - startTime)
}

function cleanup(){
    fs.rmdirSync("./" + options.problem_folder, { recursive: true })
    fs.rmdirSync("./" + options.solution_folder, { recursive: true })

    fs.mkdirSync("./" + options.problem_folder)
    fs.mkdirSync("./" + options.solution_folder)
}

async function solve_zachary(){
    fs.rmdirSync("./zachary/zachary_problem", { recursive: true })
    fs.rmdirSync("./zachary/zachary_solution", { recursive: true })

    fs.mkdirSync("./zachary/zachary_problem")
    fs.mkdirSync("./zachary/zachary_solution")

    let graph = await JSON.parse(fs.readFileSync("data/zachary_karate_club_network.json"));

    let nodemap = graph.nodes.map(n => n.id)
    graph.links = graph.links.filter(l => nodemap.includes(l.source) && nodemap.includes(l.target)) //.slice(0, 40)

    let characters = [...new Set(graph.nodes.map(n => n.id))].filter() //.slice(0, 20)
    
    for (let node of graph.nodes){
        node.id = characters.indexOf(node.id)
    }
    graph.nodes = graph.nodes.filter(n => n.id != -1)

    graph.links.filter(l => l.source != -1 && l.target != -1)
    console.log(graph.links)
    console.log(graph.nodes)
    console.log(characters)

    let lp = new Biofabric_lp_zachary(graph, options);
    await lp.makeModel();

    // await fs.writeFile("./zachary/zachary_problem/zachary.lp", lp.writeForGLPK(), function(err){
    //     if (err) return console.log(err);
    // });

    console.log("starting gurobi")

    let startTime = new Date().getTime()
    let { stdout } = await sh("gurobi_cl TimeLimit=" + options.timeout_value + " ResultFile=./zachary/zachary_solution/zachary.sol" + " LogFile=./zachary/zachary_solution/zachary.log" + " ./zachary/zachary_problem/zachary.lp")
    console.log("Time to solve ", new Date().getTime() - startTime)
}

async function solve_raccoon(){
    // fs.rmdirSync("./raccoon/raccoon_problem", { recursive: true })
    // fs.rmdirSync("./raccoon/raccoon_solution", { recursive: true })

    // fs.mkdirSync("./raccoon/raccoon_problem")
    // fs.mkdirSync("./raccoon/raccoon_solution")

    let filename = "insecta-ant-trophallaxis-colony1-day1-short"
    // remove file with same filename if existing
    try{ 
        fs.unlinkSync("raccoon/raccoon_problem/" + filename + ".lp")
        fs.unlinkSync("raccoon/raccoon_solution/" + filename + ".log")
        fs.unlinkSync("raccoon/raccoon_solution/" + filename + ".sol")
    } catch (e) {}

    let graph = {nodes: [], links: []}
    let text = await fs.readFileSync("data/raccoon/" + filename + ".edges", 'utf8')
    for (let line of text.split("\n")){
        if (line == "") continue;
        let n1 = line.split(" ")[0]
        let n2 = line.split(" ")[1]
        if (!graph.nodes.find(n => n.id == n1)) graph.nodes.push({id: n1})
        if (!graph.nodes.find(n => n.id == n2)) graph.nodes.push({id: n2})
        graph.links.push({source: n1, target: n2, id: graph.links.length})
    }

    let lp = new Biofabric_lp_raccoon(graph, options, filename);
    await lp.makeModel();

    console.log("starting gurobi")

    let startTime = new Date().getTime()
    let { stdout } = await sh("gurobi_cl" 
        + " TimeLimit=" + options.timeout_value 
        + " Tune=1 TuneTimeLimit=10"
        + " MIPFocus=1"
        // + " Heuristics=0.1"
        // + " Cuts=2"
        + " ResultFile=./raccoon/raccoon_solution/" + filename + ".sol" 
        + " LogFile=./raccoon/raccoon_solution/" + filename + ".log" 
        + " ./raccoon/raccoon_problem/" + filename + ".lp")
    console.log("Time to solve ", new Date().getTime() - startTime)
}

async function init(){
    // cleanup();
    // 7 stopped at 40

    let maxnodenumber = 50;
    let minnodenumber = 40;
    let maxfiles = Infinity;
    let maxdegreeallowed = 5;
    let single_degree = true;
    let single_degree_value = 7;
    let only_solve_timeouts = true;
    options.rewrite_exhisting_formulations = false;

    // list all files in the directory
    let files = fs.readdirSync("data/rome-lib").filter(f => f.includes(".json") && parseInt(f.split(".")[1]) <= maxnodenumber
        && parseInt(f.split(".")[1]) >= minnodenumber);

    // filter out grafo1.json
    // files = files.filter(f => f.includes("grafo10000.38.json"))
    // files = files.filter(f => f.includes("grafo1011.19.json"))
    // files = files.filter(f => f.includes(".11"))

    let num_graphs_by_max_degree = {}
    let names_of_graphs_by_max_degree = {}
    for (let file of files){
        // get max degree of graph
        let graph = JSON.parse(fs.readFileSync("data/rome-lib/" + file));
        let maxdegree = 0;
        for (let node of graph.nodes){
            let degree = graph.links.filter(l => l.source == node.id || l.target == node.id).length;
            // if degree is above maxdegreeallowed, remove it from the list of files
            if (degree > maxdegreeallowed){
                files = files.filter(f => f != file)
                // break;
            }
            if (degree > maxdegree) maxdegree = degree;
        }
        num_graphs_by_max_degree[maxdegree] = num_graphs_by_max_degree[maxdegree] ? num_graphs_by_max_degree[maxdegree] + 1 : 1;
        names_of_graphs_by_max_degree[maxdegree] = names_of_graphs_by_max_degree[maxdegree] ? names_of_graphs_by_max_degree[maxdegree] + ", " + file : file;
    }
    console.log(files.length)
    console.log(num_graphs_by_max_degree)
    // console.log(names_of_graphs_by_max_degree)

    if (single_degree) files = names_of_graphs_by_max_degree[single_degree_value].split(", ")

    // does a solution file exist?
    let solution_files = fs.readdirSync(options.solution_folder).filter(f => f.includes(".sol")).map(f => f.replace(".sol", ".json"))
    if (single_degree) console.log(files.length + " files with degree " + single_degree_value + " found.")
    // console.log(solution_files)

    if (only_solve_timeouts){
         // for each one of the files, read the solution files. if it contains "Time limit reached", keep it. otherwise, exclude it.
        let new_files = []
        for (let file of files){
            if (!solution_files.includes(file)){
                // console.log("No solution file found for ", file)
                new_files.push(file)
            } else {
                let solution_content = fs.readFileSync("" + options.solution_folder + "/" + file.replace(".json", ".log"), 'utf8')
                if (solution_content.includes("Time limit reached")){
                    new_files.push(file)
                }
            }
        }  
        console.log(new_files.length + " files to solve.")  
        files = new_files
    }

    files = files.slice(0, maxfiles);

    // sort files by max degree first, then by number of nodes
    files.sort((a, b) => {
        let graph_a = JSON.parse(fs.readFileSync("data/rome-lib/" + a));
        let graph_b = JSON.parse(fs.readFileSync("data/rome-lib/" + b));
        let maxdegree_a = 0;
        let maxdegree_b = 0;
        for (let node of graph_a.nodes){
            let degree = graph_a.links.filter(l => l.source == node.id || l.target == node.id).length;
            if (degree > maxdegree_a) maxdegree_a = degree;
        }
        for (let node of graph_b.nodes){
            let degree = graph_b.links.filter(l => l.source == node.id || l.target == node.id).length;
            if (degree > maxdegree_b) maxdegree_b = degree;
        }
        if (maxdegree_a == maxdegree_b) return parseInt(a.split(".")[1]) - parseInt(b.split(".")[1])
        else return maxdegree_a - maxdegree_b;
    })

    let filestring = "let filenames = [\n"
    for (let file of files){
        filestring += "'" + file + "', "
    }
    filestring = filestring.slice(0, filestring.length - 2) + "]\n"

    fs.writeFileSync("data/rome_lib_filenames.js", filestring, () => {});
    if (options.solve_split) solve_split_problem(files)
    else if (options.solve_adjacency) solve_adjacency_problem(files)
    else solve_entire_problem(files)
}

async function solve_entire_problem(files){
    // write all problems
    for (let file of files){
        if (!options.rewrite_exhisting_formulations &&
            fs.existsSync("./" + options.problem_folder + "/" + file.replace("json", "lp")))
                continue;
        console.log("Writing model for ", file)
        let graph = await JSON.parse(fs.readFileSync("data/rome-lib/" + file));
        let nodemap = graph.nodes.map(n => n.id)
        graph.links = graph.links.filter(l => nodemap.includes(l.source) && nodemap.includes(l.target))
        let lp = new Biofabric_lp(graph, options);
        lp.makeModel();
        // check if file already exists
        await fs.writeFile("./" + options.problem_folder + "/" + file.replace("json", "lp"), lp.writeForGLPK(), function(err){
            if (err) return console.log(err);
        });
    }

    // create dictionary of elapsed times
    let times = {};

    // write all solutions
    for (let file of files){
        let startTime = new Date().getTime()
        await solve_one_graph(file, files.indexOf(file));
        times[file] = new Date().getTime() - startTime;
        fs.writeFileSync('' + options.solution_folder + '/result_times.json', JSON.stringify(times), () => {});
    }
}

async function solve_split_problem(files){
    // solve for runways
    for (let file of files){
        let graph = JSON.parse(fs.readFileSync("data/rome-lib/" + file));
        
        // note: the heuristic solution here should help improve time to solve ILP.
        sortByDegree(graph.nodes, graph.links)
        // sortForStaircases(graph.nodes, graph.links)
        // end of heuristic solution

        let lp = new Biofabric_lp(graph);
        lp.makeModelRunways();
        fs.writeFileSync("./" + options.problem_folder + "/" + file.replace("json", "lp"), lp.writeForGLPK(), function(err){
            if (err) return console.log(err);
        });
    }

    // create dictionary of elapsed times
    let times = {};

    // write all solutions
    for (let file of files){
        let startTime = new Date().getTime()
        await solve_one_graph(file, files.indexOf(file));
        times[file] = new Date().getTime() - startTime;
        fs.writeFileSync('' + options.solution_folder + '/result_times.json', JSON.stringify(times), () => {});
    }
}

async function solve_adjacency_problem(files){
    // solve for runways
    for (let file of files){
        let graph = JSON.parse(fs.readFileSync("data/rome-lib/" + file));
        
        // note: the heuristic solution here should help improve time to solve ILP.
        sortByDegree(graph.nodes, graph.links)
        // sortForStaircases(graph.nodes, graph.links)
        // end of heuristic solution

        let lp = new Biofabric_lp(graph);
        lp.makeModelAdjacency();
        fs.writeFileSync("./" + options.problem_folder + "/" + file.replace("json", "lp"), lp.writeForGLPK(), function(err){
            if (err) return console.log(err);
        });
    }

    // create dictionary of elapsed times
    let times = {};

    // write all solutions
    for (let file of files){
        let startTime = new Date().getTime()
        await solve_one_graph(file, files.indexOf(file));
        times[file] = new Date().getTime() - startTime;
        fs.writeFileSync('' + options.solution_folder + '/result_times.json', JSON.stringify(times), () => {});
    }
}

// init();
solve_raccoon();
// solve_zachary();
