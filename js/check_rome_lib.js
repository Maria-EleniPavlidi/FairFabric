const fs = require('fs');
const path = require('path');

// open all files in data/rome-lib and find one whose name includes 
const directoryPath = path.join(__dirname, '../data/rome-lib');
fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    files.forEach(function (file) {
        if (file.includes('o2694.')) {
            console.log('Found file:', file);

            // read the file
            const filePath = path.join(__dirname, '../data/rome-lib', file);

            // print number of nodes, number of edges, density, average degree and max degree
            const data = JSON.parse(fs.readFileSync(filePath
                , 'utf8'));

            console.log('Number of nodes:', data.nodes.length);
            console.log('Number of edges:', data.links.length);
            console.log('Density:', data.links.length / (data.nodes.length * (data.nodes.length - 1)));
            console.log('Average degree:', data.links.length / data.nodes.length);
            console.log('Max degree:', Math.max(...data.nodes.map(node => data.links.filter(link => link.source == node.id || link.target == node.id).length

            )));
        }
    });
});