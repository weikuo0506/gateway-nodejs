/**
 * Created by wk on 2017/4/13.
 */
var express = require('express');
var PORT = 1234;
//start web server
var app = express();
app.use(express.static('public'));
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


});
app.listen(PORT,function(){
    console.log("server is runing at port %d", PORT);
})
