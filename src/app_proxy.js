/**
 * Created by wk on 2017/4/12.
 */
var http = require('http');
var httpProxy = require('http-proxy');
var PORT = 1234;
//create proxy and listen on error
var proxy = httpProxy.createProxyServer();
proxy.on('error',function(err,req,res) {
    res.end();
});
//create server
var app = http.createServer(function(req,res) {
    //do proxy
    console.log('receive req from host ' + req.headers.host + " redirect to port " + PORT);
    proxy.web(req, res, {target: 'http://localhost:8080'});
});
app.listen(PORT,function() {
    console.log('server is running at %d', PORT);
});
