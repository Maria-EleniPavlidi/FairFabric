const fs = require('fs');

class Biofabric_lp_raccoon{
    constructor(graph, options, filename){
        this.g = graph;
        this.filename = filename;
        this.model = {};
        this.m = 50;
        this.zcount = 0;
        this.verbose = false;
        this.mip = true;

        this.options = options;

        this.mode = "triplets";
    }

    async arrange(){
        this.startTime = new Date().getTime()

        this.makeModel()

        let startTime2 = new Date().getTime()
        
        this.solve()

        this.elapsedTime = new Date().getTime() - this.startTime;
        this.solveTime = new Date().getTime() - startTime2;

        console.log(this.solveTime, this.modelToString(this.model), this.result)
    }

    async makeModel(){
        await this.fillModel()

        // if (this.model.objective_function.length <= 10) {
        //     this.model.objective_function = this.model.objective_function.substring(0, this.model.objective_function.length - 1)
        //     this.model.objective_function += 'empty\n\n';
        // }

        // if (this.model.subjectTo.length <= 12) {
        //     this.model.subjectTo += 'empty = 1\n';
        // }
    }

    async fillModel(){
        if (this.mode == "triplets") await this.fillModelTriplets();
        else this.fillModelPairs();
    }

    async fillObjectiveFunction(){
        this.model.objective_function = "Maximize \n"

        let added_cvars = []

        // compute objective values
        for (let n of this.g.nodes){
            let adjacent_edges = this.g.links.filter(e => e.source == n.id || e.target == n.id)
            // can't be a staircase if the node has less than 3 neighbors
            if (adjacent_edges.length < 3) continue;

            for (let i = 0; i < adjacent_edges.length - 2; i++){
                for (let j = i + 1; j < adjacent_edges.length - 1; j++){
                    for (let k = j + 1; k < adjacent_edges.length; k++){
                        if (i == j || i == k || j == k) continue;

                        let edge1 = adjacent_edges[i]
                        let edge2 = adjacent_edges[j]
                        let edge3 = adjacent_edges[k]

                        let sorted_edge_ids = [edge1.id, edge2.id, edge3.id].sort((a, b) => a - b)

                        let c1 = "c_n" + n.id + "_e" + sorted_edge_ids[0] + "_e" + sorted_edge_ids[1] + "_e" + sorted_edge_ids[2] + "_";
                        let c2 = "c_n" + n.id + "_e" + sorted_edge_ids[0] + "_e" + sorted_edge_ids[2] + "_e" + sorted_edge_ids[1] + "_";
                        let c3 = "c_n" + n.id + "_e" + sorted_edge_ids[1] + "_e" + sorted_edge_ids[0] + "_e" + sorted_edge_ids[2] + "_";

                        added_cvars.push(c1)
                        added_cvars.push(c2)
                        added_cvars.push(c3)

                        // the weight must be the degree of the node
                        let w = Math.round(1/this.g.links.filter(e => e.source == n.id || e.target == n.id).length * 100)

                        if (this.options.optimization_objective == 1) this.model.objective_function += c1 + " + " + c2 + " + " + c3 + " + "
                        else if (this.options.optimization_objective == 0) this.model.objective_function += w + " " + c1 + " + " + w + " " + c2 + " + " + w + " " + c3 + " + "
                        this.model.bounds += "binary " + c1 + "\n"
                        this.model.bounds += "binary " + c2 + "\n"
                        this.model.bounds += "binary " + c3 + "\n"
                    }
                }
            }
        }

        this.model.objective_function = this.model.objective_function.substring(0, this.model.objective_function.length - 2) + "\n"

        // write first row in file
        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "Maximize\n" +
            [... new Set(added_cvars)].join(" + ") + "\n", 'utf8');
    }

    async fillModelTriplets(){
        await this.fillObjectiveFunction()
        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "\nSubject to\n", 'utf8');
        this.model.bounds = "\nBinaries \n"

        let added_xvars = []
        let added_cvars = []
        let added_pvars = []

        // find redundant edges: edges that can't participate in a staircase because they are not connected to a node with degree > 2
        let redundant_edges = this.g.links.filter(e => {
            let source_degree = this.g.links.filter(l => l.source == e.source || l.target == e.source).length
            let target_degree = this.g.links.filter(l => l.source == e.target || l.target == e.target).length
            return source_degree < 3 && target_degree < 3
        })
        // compute the opposite of the redundant edges: the non-redundant ones
        this.g.links = this.g.links.filter(e => !redundant_edges.includes(e))
        // remove all nodes that have degree 0
        // this.g.nodes = this.g.nodes.filter(n => this.g.links.filter(e => e.source == n.id || e.target == n.id).length > 0)

        // add definition of variables on x
        for (let i = 0; i < this.g.links.length - 1; i++){
            for (let j = i + 1; j < this.g.links.length; j++){
                let a = "e" + this.g.links[i].id
                let b = "e" + this.g.links[j].id
                let x_ab = "x_" + a + b
                this.model.bounds += " " + x_ab + ""
                added_xvars.push(x_ab)
            }
        }

        // add definition of variables on y
        for (let i = 0; i < this.g.nodes.length - 1; i++){
            for (let j = i + 1; j < this.g.nodes.length; j++){
                let a = "n" + this.g.nodes[i].id
                let b = "n" + this.g.nodes[j].id
                let y_ab = "y_" + a + b
                this.model.bounds += " " + y_ab + ""
                added_xvars.push(y_ab)
                // added_yvars.push(y_ab)
            }
        }

        // add transitivity constraints on x
        await this.addTransitivityConstraintsX(added_xvars, "x");

        // add transitivity constraints on y
        for (let i = 0; i < this.g.nodes.length - 2; i++){
            if (this.verbose) console.log("adding transitivity constraints on y", i)
            for (let j = i + 1; j < this.g.nodes.length - 1; j++){
              for (let k = j + 1; k < this.g.nodes.length; k++){
                if (i == j || i == k || j == k) continue;
                
                let y_ab = "y_n" + this.g.nodes[i].id + "n" + this.g.nodes[j].id
                let y_bc = "y_n" + this.g.nodes[j].id + "n" + this.g.nodes[k].id
                let y_ac = "y_n" + this.g.nodes[i].id + "n" + this.g.nodes[k].id
                
                // check that all these exist
                if (!added_xvars.includes(y_ab)) console.warn(y_ab + " not found")
                if (!added_xvars.includes(y_bc)) console.warn(y_bc + " not found")
                if (!added_xvars.includes(y_ac)) console.warn(y_ac + " not found")

                await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", y_ab + " + " + y_bc + " - " + y_ac + " >= 0\n", 'utf8');
                await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "- " + y_ab + " - " + y_bc + " + " + y_ac + " >= - 1\n", 'utf8');
              }
            }
          }

        // compute position of edges
        for (let e1 of this.g.links){
            let pos_e1 = "pos_e" + e1.id 
            added_pvars.push(pos_e1)
            let tmp_accumulator = this.g.links.length - 1;

            for (let e2 of this.g.links){
                if (e1 == e2) continue;
                let x_e1e2 = "x_e" + e1.id + "e" + e2.id
                
                
                if (!added_xvars.includes(x_e1e2)) {
                    pos_e1 += " - " + "x_e" + e2.id + "e" + e1.id
                    tmp_accumulator -= 1
                }
                else {
                    pos_e1 += " + " + x_e1e2
                }
            }
            await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", pos_e1 + " = " + tmp_accumulator + "\n", 'utf8');
        }

        // define the positions, that will be used to determine if two edges are adjacent (z)
        for (let n of this.g.nodes){
            let adjacent_edges = this.g.links.filter(e => e.source == n.id || e.target == n.id)
            if (adjacent_edges.length < 3) continue;
            for (let i = 0; i < adjacent_edges.length - 1; i++){
                for (let j = i + 1; j < adjacent_edges.length; j++){
                    if (i == j) continue;

                    let edge1 = adjacent_edges[i]
                    let edge2 = adjacent_edges[j]
                    let sorted_edge_ids = [edge1.id, edge2.id].sort((a, b) => a - b)

                    let z1 = "z_e" + sorted_edge_ids[0] + "e" + sorted_edge_ids[1];
                    
                    await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "pos_e" + edge2.id + " - pos_e" + edge1.id + " + " + this.m + " " + z1 + " <= " + (1 + this.m + 0.01) + "\n", 'utf8');
                    await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "pos_e" + edge2.id + " - pos_e" + edge1.id + " - " + this.m + " " + z1 + " >= " + (- 1 - this.m - 0.01) + "\n", 'utf8');

                    this.model.bounds += " " + z1 + ""

                    await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "pos_e" + edge1.id + " <= " + this.g.links.length + "\n", 'utf8');
                    await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "pos_e" + edge2.id + " <= " + this.g.links.length + "\n", 'utf8');

                }
            }
        }

        // compute objective values
        for (let n of this.g.nodes){
            let adjacent_edges = this.g.links.filter(e => e.source == n.id || e.target == n.id)
            // can't be a staircase if the node has less than 3 neighbors
            if (adjacent_edges.length < 3) continue;

            for (let i = 0; i < adjacent_edges.length - 2; i++){
                for (let j = 0; j < adjacent_edges.length - 1; j++){
                    for (let k = j + 1; k < adjacent_edges.length; k++){
                        if (i == j || i == k || j == k) continue;

                        let edge1 = adjacent_edges[i]
                        let edge2 = adjacent_edges[j]
                        let edge3 = adjacent_edges[k]

                        let sorted_edge_ids = [edge1.id, edge2.id, edge3.id].sort((a, b) => a - b)
                        let edges_sorted_by_their_ids = [edge1, edge2, edge3].sort((a, b) => a.id - b.id)
                        let othernode1 = edges_sorted_by_their_ids[0].source == n.id ? edges_sorted_by_their_ids[0].target : edges_sorted_by_their_ids[0].source
                        let othernode2 = edges_sorted_by_their_ids[1].source == n.id ? edges_sorted_by_their_ids[1].target : edges_sorted_by_their_ids[1].source
                        let othernode3 = edges_sorted_by_their_ids[2].source == n.id ? edges_sorted_by_their_ids[2].target : edges_sorted_by_their_ids[2].source
                        
                        let z1 = "z_e" + sorted_edge_ids[0] + "e" + sorted_edge_ids[1];
                        let z2 = "z_e" + sorted_edge_ids[1] + "e" + sorted_edge_ids[2];
                        let z3 = "z_e" + sorted_edge_ids[0] + "e" + sorted_edge_ids[2];

                        let c1 = "c_n" + n.id + "_e" + sorted_edge_ids[0] + "_e" + sorted_edge_ids[1] + "_e" + sorted_edge_ids[2] + "_";
                        let c2 = "c_n" + n.id + "_e" + sorted_edge_ids[0] + "_e" + sorted_edge_ids[2] + "_e" + sorted_edge_ids[1] + "_";
                        let c3 = "c_n" + n.id + "_e" + sorted_edge_ids[1] + "_e" + sorted_edge_ids[0] + "_e" + sorted_edge_ids[2] + "_";

                        let accumulator1 = 0;
                        let accumulator2 = 0;
                        let accumulator3 = 0;
                        let y1 = "y_n" + othernode1 + "n" + othernode2;
                        let y1sign = "+"
                        let y2 = "y_n" + othernode2 + "n" + othernode3;
                        let y2sign = "+"
                        let y3 = "y_n" + othernode1 + "n" + othernode3;
                        let y3sign = "+"

                        if (!added_xvars.includes(y1)) {y1 = "y_n" + othernode2 + "n" + othernode1; accumulator1 += 1; y1sign = "-"}
                        if (!added_xvars.includes(y2)) {y2 = "y_n" + othernode3 + "n" + othernode2; accumulator2 += 1; y2sign = "-"}
                        if (!added_xvars.includes(y3)) {y3 = "y_n" + othernode3 + "n" + othernode1; accumulator3 += 1; y3sign = "-"}

                        let string_to_print = ""

                        string_to_print    += c1 
                                                + " - " + z1
                                                + " <= 0\n"
                        string_to_print    += c1
                                                + " - " + z2
                                                + " <= 0\n"
                        string_to_print    += c1
                                                + (y1sign == "+"? " - " : " + ") + y1
                                                + (y2sign == "+"? " + " : " - ") + y2
                                                + " <= " + (1 + accumulator1 - accumulator2) + "\n"
                        string_to_print    += c1  
                                                + (y1sign == "+"? " + " : " - ") + y1
                                                + (y2sign == "+"? " - " : " + ") + y2
                                                + " <= " + ( - accumulator1 + accumulator2 + 1) + "\n"

                        string_to_print    += c2
                                                + " - " + z2
                                                + " <= 0\n"

                        string_to_print    += c2
                                                + " - " + z3
                                                + " <= 0\n"

                        string_to_print    += c2
                                                + (y2sign == "+"? " - " : " + ") + y2
                                                + (y3sign == "+"? " - " : " + ") + y3
                                                + " <= " + (0 + accumulator2 + accumulator3) + "\n"

                        string_to_print    += c2
                                                + (y2sign == "+"? " + " : " - ") + y2
                                                + (y3sign == "+"? " + " : " - ") + y3
                                                + " <= " + (2 - accumulator2 - accumulator3) + "\n"

                        string_to_print    += c3
                                                + " - " + z1
                                                + " <= 0\n"

                        string_to_print    += c3
                                                + " - " + z3
                                                + " <= 0\n"

                        string_to_print    += c3
                                                + (y1sign == "+"? " - " : " + ") + y1
                                                + (y3sign == "+"? " - " : " + ") + y3
                                                + " <= " + (0 + accumulator1 + accumulator3) + "\n"

                        string_to_print    += c3
                                                + (y1sign == "+"? " + " : " - ") + y1   
                                                + (y3sign == "+"? " + " : " - ") + y3
                                                + " <= " + (2 - accumulator1 - accumulator3) + "\n"

                        string_to_print    += c1 + " + " + c2 + " + " + c3 + " <= 1\n"

                        string_to_print    += c1 
                                                + " - 0.5 " + z1 
                                                + " - 0.5 " + z2
                                                + " - 0.5 " + z3
                                                +  " <= 0\n"

                        string_to_print    += c2
                                                + " - 0.5 " + z1
                                                + " - 0.5 " + z2
                                                + " - 0.5 " + z3
                                                + " <= 0\n"

                        string_to_print    += c3
                                                + " - 0.5 " + z1
                                                + " - 0.5 " + z2
                                                + " - 0.5 " + z3
                                                + " <= 0\n"

                        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", string_to_print, 'utf8');

                        this.model.bounds += " " + c1 + ""
                        this.model.bounds += " " + c2 + ""
                        this.model.bounds += " " + c3 + ""

                        added_cvars.push(c1)
                        added_cvars.push(c2)
                        added_cvars.push(c3)
                    }
                }
            }
        }

        // get the node with the highest degree
        let node_with_highest_degree = this.g.nodes.reduce((a, b) => this.g.links.filter(e => e.source == a.id || e.target == a.id).length > this.g.links.filter(e => e.source == b.id || e.target == b.id).length ? a : b)
        let degree_of_node_with_highest_degree = this.g.links.filter(e => e.source == node_with_highest_degree.id || e.target == node_with_highest_degree.id).length
        // get all the cvars associated with this node
        let cvars = [...new Set(added_cvars.filter(c => c.includes("n" + node_with_highest_degree.id + "_")))]
        // the sum of these cvars has to be equal to the degree of the node
        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", 
            cvars.join(" + ") + " >= " + (- 2 + degree_of_node_with_highest_degree) + "\n", 'utf8');

        // get all the nodes adjacent to the node with the highest degree
        let adjacent_nodes = this.g.links.filter(e => e.source == node_with_highest_degree.id || e.target == node_with_highest_degree.id).map(e => e.source == node_with_highest_degree.id ? e.target : e.source)
        // what are the degrees of these nodes?
        let degrees = adjacent_nodes.map(n => this.g.links.filter(e => e.source == n || e.target == n).length)
        // collect in an array all the adjacent nodes that have degree less than 2
        let nodes_with_degree_less_than_2 = adjacent_nodes.filter(n => this.g.links.filter(e => e.source == n || e.target == n).length < 3)
        // get the adjacent node with the highest degree
        let node_with_highest_degree_adjacent = this.g.nodes.find(n => n.id == adjacent_nodes[degrees.indexOf(Math.max(...degrees))])
        // how many edges do they share?
        let shared_edges = this.g.links.filter(e => (e.source == node_with_highest_degree.id || e.target == node_with_highest_degree.id) && (e.source == node_with_highest_degree_adjacent.id || e.target == node_with_highest_degree_adjacent.id))
        // get the second adjacent node with the highest degree
        let node_with_highest_degree_adjacent2 = this.g.nodes.find(n => n.id == adjacent_nodes[degrees.indexOf(Math.max(...degrees.filter(d => d != Math.max(...degrees))))])
        // how many edges do they share?
        let shared_edges2 = this.g.links.filter(e => (e.source == node_with_highest_degree.id || e.target == node_with_highest_degree.id) && (e.source == node_with_highest_degree_adjacent2.id || e.target == node_with_highest_degree_adjacent2.id))
        if (shared_edges.length == 1 && shared_edges2.length == 1){
            // the difference between the position of the first shared edge and the second shared edge has to be degree_of_node_with_highest_degree
            await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp",
                "pos_e" + shared_edges2[0].id + " - pos_e" + shared_edges[0].id + " = " + (degree_of_node_with_highest_degree - 1) + "\n", 'utf8');

            let last_edge = shared_edges2[0]
            for (let n of nodes_with_degree_less_than_2){
                // find the shared edge
                let shared_edge = this.g.links.find(e => (e.source == node_with_highest_degree.id || e.target == node_with_highest_degree.id) && (e.source == n || e.target == n))

                await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp",
                    "pos_e" + last_edge.id + " - pos_e" + shared_edge.id + " = 1\n", 'utf8');

                last_edge = shared_edge;
            }

            // the sum of the c associated with node_with_highest_degree_adjacent has to be equal to its degree - 2
            // cvars = [...new Set(added_cvars.filter(c => c.includes("n" + node_with_highest_degree_adjacent.id + "_")))]
            // await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", cvars.join(" + ") 
            //     + " >= " + (- 3 + this.g.links.filter(e => e.source == node_with_highest_degree_adjacent.id || e.target == node_with_highest_degree_adjacent.id).length) + "\n", 'utf8');
        }


        // // every edge can participate in at most 2 staircases, or 3 if they all share a central node
        // for (let e of this.g.links){
        //     let cvars = added_cvars.filter(c => c.includes("_e" + e.id + "_"))
        //     if (cvars.length <= 2) continue;

        //     // group cvars by their central node
        //     let cvars_by_node = {}
        //     for (let c of cvars){
        //         let node = c.split("_")[1].substring(1)
        //         if (!cvars_by_node[node]) cvars_by_node[node] = []
        //         cvars_by_node[node].push(c)
        //     }
        //     for (let node of Object.keys(cvars_by_node)){
        //         let cvars = cvars_by_node[node]
        //         await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", cvars.join(" + ") + " <= 3\n", 'utf8');
        //     }

        //     if (Object.keys(cvars_by_node).length == 1) continue;
            
        //     // if the cvars have a different central node, they can only be part of 2 staircases
        //     for (let i = 0; i < Object.keys(cvars_by_node).length; i++){
        //         let n1 = Object.keys(cvars_by_node)[i];
        //         for (let cvar of cvars_by_node[n1]){
        //             for (let j = 0; j < Object.keys(cvars_by_node).length; j++){
        //                 if (i == j) continue;
        //                 let n2 = Object.keys(cvars_by_node)[j];
        //                 for (let cvar2 of cvars_by_node[n2]){
        //                     for (let cvar3 of cvars_by_node[n2]){
        //                         if (cvar2 == cvar3) continue;
        //                         await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", cvar + " + " + cvar2 + " + " + cvar3 + " <= 2\n", 'utf8');
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }

        // // // nodes that participate in a staircase and have a degree of 1 are free to move around and can be placed anywhere
        // for (let node of this.g.nodes){
        //     // get node degree
        //     let degree = this.g.links.filter(e => e.source == node.id || e.target == node.id).length
        //     if (degree < 3) continue;
        //     // get all the node neighbors of the node in question
        //     let adjacent_edges = this.g.links.filter(e => e.source == node.id || e.target == node.id)

        //     // get the nodes at the other endpoint of these edges
        //     let neighbors = adjacent_edges.map(e => e.source == node.id ? e.target : e.source)
            
        //     // console.log(node.id, neighbors)
        //     // get three neighbors that either have a degree of 1 or 2
        //     let neighbors_to_consider = neighbors.filter(n => this.g.links.filter(e => e.source == n || e.target == n).length < 3)

        //     if (neighbors_to_consider.length < 3) continue;

        //     for (let i = 0; i < neighbors_to_consider.length - 2; i++){
        //         let edge_with_ni = adjacent_edges.filter(e => e.source == neighbors_to_consider[i] || e.target == neighbors_to_consider[i])[0]
        //         let edge_with_nj = adjacent_edges.filter(e => e.source == neighbors_to_consider[i + 1] || e.target == neighbors_to_consider[i + 1])[0]
        //         let edge_with_nk = adjacent_edges.filter(e => e.source == neighbors_to_consider[i + 2] || e.target == neighbors_to_consider[i + 2])[0]

        //         // find the cvars corresponding to these edges
        //         cvars = [...new Set(added_cvars.filter(c => c.includes("e" + edge_with_ni.id) && c.includes("e" + edge_with_nj.id) && c.includes("e" + edge_with_nk.id)))]

        //         console.log(cvars)

        //         // this.model.subjectTo += cvars.join(" + ") + " >= 1\n"
        //         await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", this.model.subjectTo += cvars.join(" + ") + " >= 1\n", 'utf8');
        //     }
        // }

        await this.add_raccoon_statements();

        // print bounds in file
        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", this.model.bounds, 'utf8');

        // print all the added y_vars as integer variables
        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "\n\nIntegers\n", 'utf8');
        let string_to_append = ""
        for (let p of added_pvars){
            string_to_append += p + " "
        }
        await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", string_to_append, 'utf8');
    }

    async add_raccoon_statements(){
        let statements = [
        ]
        for (let s of statements){
            await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", s, 'utf8');
        }
    }

    solve(){
        let prob = this.modelToString(this.model)
        this.modelString = prob;

        this.result = {}
        let objective, i;

        if (this.verbose) glp_set_print_func(console.log);

        let lp = glp_create_prob();
        glp_read_lp_from_string(lp, null, prob);

        glp_scale_prob(lp, GLP_SF_AUTO);
            
        let smcp = new SMCP({presolve: GLP_ON});
        glp_simplex(lp, smcp);

        if (this.mip){
            glp_intopt(lp);
            objective = glp_mip_obj_val(lp);

            for(i = 1; i <= glp_get_num_cols(lp); i++){
                this.result[glp_get_col_name(lp, i)] = glp_mip_col_val(lp, i);
            }
        } else {
            objective = glp_get_obj_val(lp);
            for(i = 1; i <= glp_get_num_cols(lp); i++){
                this.result[glp_get_col_name(lp, i)] = glp_get_col_prim (lp, i);
            }
        }
    }

    async addTransitivityConstraintsX(added_xvars, varname = "x"){
        // add transitivity constraints on x
        for (let i = 0; i < this.g.links.length - 2; i++){
            if (this.verbose) console.log("adding transitivity constraints on x", i)
            for (let j = i + 1; j < this.g.links.length - 1; j++){
                for (let k = j + 1; k < this.g.links.length; k++){
                let x_ab = varname + "_e" + this.g.links[i].id + "e" + this.g.links[j].id
                let x_bc = varname + "_e" + this.g.links[j].id + "e" + this.g.links[k].id
                let x_ac = varname + "_e" + this.g.links[i].id + "e" + this.g.links[k].id
                // check that all these exist
                if (!added_xvars.includes(x_ab)) console.warn(x_ab + " not found")
                if (!added_xvars.includes(x_bc)) console.warn(x_bc + " not found")
                if (!added_xvars.includes(x_ac)) console.warn(x_ac + " not found")

                await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", x_ab + " + " + x_bc + " - " + x_ac + " >= 0\n", 'utf8');
                await fs.appendFileSync("./raccoon/raccoon_problem/" + this.filename + ".lp", "- " + x_ab + " - " + x_bc + " + " + x_ac + " >= - 1\n", 'utf8');
                }
            }
        }
    }

    modelToString(){
        return this.model.objective_function + this.model.subjectTo + this.model.bounds + '\nEnd\n'
    }

    apply_solution(){
        if (this.options.solve_adjacency){
            // console.log(this.result)
            // find edges that have no left neighbors
            let edges_without_left_neighbors = this.g.links.filter(e => {
                let id = e.id;
                return this.g.links.filter(l => l.id != id).every(l => this.result["l_e" + id + "e" + l.id] == 0)
            })
            // console.log(edges_without_left_neighbors.map(e => e.id))
            // in this.result, print all l_e that are 1
            // console.log(Object.keys(this.result).filter(k => k.includes("l_e") && this.result[k] == 1))
        
            let new_edge_list = []
            let next_edge;
            let next_next_edge;

            if (edges_without_left_neighbors.length > 0) next_edge = edges_without_left_neighbors[0]
            else next_edge = this.g.links[0]
            next_edge.visited = true;
            new_edge_list.push(next_edge)

            // find the next edge that has the previous edge as a left neighbor
            for (let i = 0; i < this.g.links.length - 1; i++){
                // find the edge that has the next_edge as a left neighbor
                next_next_edge = this.g.links.find(e => this.result["l_e" + e.id + "e" + next_edge.id] == 1)
                if (next_next_edge != undefined && next_next_edge.visited == true) console.warn("solution contains loops", next_edge.id, next_next_edge.id)
                
                if (next_next_edge == undefined) {
                    // console.log("no right neighbor found for edge", next_edge.id)
                    if (edges_without_left_neighbors.filter(f => !f.visited).length > 0) next_next_edge = edges_without_left_neighbors.filter(f => !f.visited)[0]
                    else next_next_edge = this.g.links.find(e => !e.visited)
                }
                // console.log(next_edge.id, next_next_edge.id)
                next_next_edge.visited = true;
                new_edge_list.push(next_next_edge)
                next_edge = next_next_edge
            }

            this.g.links = new_edge_list
        } else {
            this.g.links.sort((a, b) => {
                let aid = a.id;
                let bid = b.id;
                
                if (this.result["x_e" + aid + "e" + bid] == 0) return 1;
                else if (this.result["x_e" + aid + "e" + bid] == 1) return -1;
                else if (this.result["x_e" + bid + "e" + aid] == 1) return 1;
                else if (this.result["x_e" + bid + "e" + aid] == 0) return -1;
            })

            this.g.nodes.sort((a, b) => {
                let aid = a.id;
                let bid = b.id;
                
                if (this.result["y_n" + aid + "n" + bid] == 0) return 1;
                else if (this.result["y_n" + aid + "n" + bid] == 1) return -1;
                else if (this.result["y_n" + bid + "n" + aid] == 1) return 1;
                else if (this.result["y_n" + bid + "n" + aid] == 0) return -1;
            })
        }
    }

    writeForGLPK(){
        let tmpstring = ""
        for (let elem of this.model.bounds.split("\n")){
            tmpstring += elem.replace("binary ", " ").replace("Bounds", "Binaries\n")
        }
        return this.model.objective_function.slice(0, this.model.objective_function.length - 1) + this.model.subjectTo + tmpstring + '\nEnd\n'
    }

    async readFromGLPK(filename){
        await fetch(filename)
            .then(response => response.text())
            .then(text => {
                this.result = {};

                // split text and remove everything above "   No. Column name       Activity     Lower bound   Upper bound"
                text = text.split("No. Column name       Activity     Lower bound   Upper bound")[1]
                text = text.split("------ ------------    ------------- ------------- -------------")[1]

                for (let i in text.split("\n")){
                    const pattern = /^\s*\d+\s+(\w+)\s+(?:\*|\s)\s+(\d+)\s+\d+/;
                    const match = text.split("\n")[i].match(pattern);
                    if (match) {
                        this.result[match[1]] = parseFloat(match[2])
                    }
                }
                this.apply_solution();

                const evt = new Event('solution_reading_complete');
                document.dispatchEvent(evt)
            })
    }

    async readFromGurobi(filename){
        await fetch(filename)
            .then(response => response.text())
            .then(text => {
                this.result = {};

                for (let i in text.split("\n")){
                    const match = text.split("\n")[i].split(" ")
                    this.result[match[0]] = parseFloat(match[1])
                }
                this.apply_solution();

                const evt = new Event('solution_reading_complete');
                document.dispatchEvent(evt)
            })
    
    }
}

try {
    module.exports = exports = Biofabric_lp_raccoon;
 } catch (e) {}