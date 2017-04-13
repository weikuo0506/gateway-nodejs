/**
 * Created by wk on 2017/4/12.
 */
var express = require('express');
var PORT = 1234;
var app = express();
app.use(express.static("."));
app.listen(PORT,function() {
    console.log('server is running at %d',PORT);
});
app.get("/info",function(req,res) {
    res.send('this is a micro service gateway!');
});