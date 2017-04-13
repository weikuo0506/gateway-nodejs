/**
 * Created by wk on 2017/4/12.
 *
 * https://nodejs.org/dist/latest-v6.x/docs/api/cluster.html#cluster_how_it_works
 */
var http = require('http');
var cluster = require('cluster');
var os = require('os');
var PORT = 1234;
var CPUS = os.cpus().length;
console.log("cpu number is " + CPUS);
if(cluster.isMaster) {
    console.log('Master ${process.pid} is running');
    // Fork workers.
    for(var i=0;i<CPUS;i++) {
        cluster.fork();
    }

}else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    var app = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>hello world</h1>');
        res.end();
    });
    app.listen(PORT, function () {
        console.log('server is running at %d', PORT);
    });
    console.log('Worker ${process.pid} started'); //Please note that on Windows, it is not yet possible to set up a named pipe server in a worker.
}