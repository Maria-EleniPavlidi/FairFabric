let options = { 
    solver_in_use: "gurobi",
    
    timeout_value: 50,
    // timeout_value: 25200,

    solve_split: false,
    solve_adjacency: false,

    optimization_objective: 1, // select 1 for unweighted objective function, 0 for weighted

    problem_folder: "lp_problems",
    solution_folder: "lp_solutions_precomputed",
}

try { exports.options = options; } catch(e){} // for node.js