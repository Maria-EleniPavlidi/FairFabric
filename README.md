# ilp-biofabric

To write all the problem formulations for Rome-Lib and then solve them using Gurobi, execute run_ilp.js with node. From the root folder of this project, type:

```node ./js/run_ilp.js```

Wait for it to finish - note that it will take a long time. A number of options (such as the timeout) can be changed from js/options.js. The folder "lp_problems" will be populated, and, after solving, the solutions will be written in lp_solutions. 

lp_solutions_precomputed contains solutions already computed by us. In order to see the results of the computed solutions, open "multiple_tests.html" and type (in the html) the filenames you want to visualize.

"multiple_tests_precomputed.html" instead shows a number of solutions already computed by us.

To see statistics about the computed folder, open stats.html, provided you have changed in options.js to point to the correct folder containing the solutions. Thus, if you want to see the precomputed solutions, change the folder to "lp_solutions_precomputed".

Remember that the whole folder needs to be served in order to visualize the results, otherwise you will incur in CORS issues.
A simple way to run a server is to execute the following command in the root folder of this project:

```python3 -m http.server```

Then, open your browser and type "localhost:8000" in the address bar.
 
