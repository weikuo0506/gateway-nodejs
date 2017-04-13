/**
 * Created by wk on 2017/4/13.
 */
var express = require('express');
var PORT = 1234;

var zookeeper = require('node-zookeeper-client');
var CONNECTION_STR = '127.0.0.1:2181';
var REGISTRY_ROOT = '/microservices';

//get zk client and connect to zk
var zk = zookeeper.createClient(CONNECTION_STR);
zk.connect();

//proxy server
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();
proxy.on('error',function(err,req,res){
    res.end();
});

//server addr cache
var cache = {};

var cluster = require('cluster');
var os = require('os');
var CPUS = os.cpus().length;
if(cluster.isMaster) {
    console.log('Master ${process.pid} is running');
    // Fork workers.
    for(var i=0;i<CPUS;i++) {
        cluster.fork();
    }
}else {
    //start web server
    var app = express();
    app.use(express.static('public'));   //be careful with the static dir;

    app.all('*',function(req,res){
        //ignore favicon
        if(req.path == '/favicon.ico'){
            res.end();
            return;
        }
        //handle service
        var serviceName = req.get('service-name');
        console.log('received req, serviceName: %s', serviceName);
        if(!serviceName) {
            console.log('service-name not exist in req headers');
            res.end();
            return;
        }
        //do proxy dynamicly
        //add service addr in memory cache here

        var serviceAddr;
        console.log('cached value: '+cache[serviceName])
        if(!(typeof (cache[serviceName]) == 'undefined')){
            console.log("serviceAddr exists in cache, serviceAddr: %s",  cache[serviceName]);
            serviceAddr = cache[serviceName];
            //5. do inverse http proxy
            proxy.web(req, res, {
                target: 'http://' + serviceAddr
            });
        }else {
            console.log("serviceAddr not exists in cache, query from zk now");
            //1. get serivce path in zk
            var servicePath = REGISTRY_ROOT + '/' + serviceName;
            console.log('servicePath: %s', servicePath);
            //2. get service addr path in zk
            zk.getChildren(servicePath, function (err, addrNodes) {
                if(err) {
                    console.log("get service addr error: "+err.stack);
                    res.end();
                    return;
                }
                var size = addrNodes.length;
                if(size ==0) {
                    console.log("addr node is not exist");
                    res.end();
                    return;
                }
                //3. pick one service provider
                var addrPath = servicePath + '/';
                if(size == 1) {
                    addrPath += addrNodes[0];
                }else {
                    addrPath += addrNodes[parseInt(Math.random() * size)];
                }
                console.log('addrPath: %s', addrPath);

                //judge exist first
                zk.exists(addrPath,function(event){
                    if(event.NODE_DELETED) {
                        cache = {}; //clear cache
                    }
                },function(err,stat){
                    if(stat) {
                        //4. get service addr;
                        zk.getData(addrPath,function(err,addr) {
                            if(err) {
                                console.log("get service addr data error: " + err.stack);
                                res.end();
                                return;
                            }
                            console.log('serviceAddr: %s', addr);
                            if(!addr) {
                                console.log('service addr is not exist');
                                res.end();
                                return;
                            }
                            serviceAddr = addr;
                            cache[serviceName] = serviceAddr;// add to cache
                            console.log('cache value now: '+cache[serviceName])
                            //5. do inverse http proxy
                            proxy.web(req, res, {
                                target: 'http://' + serviceAddr
                            });
                        });
                    }
                });
            });
        }
    });
    app.listen(PORT,function(){
        console.log("server is runing at port %d", PORT);
    });

}


