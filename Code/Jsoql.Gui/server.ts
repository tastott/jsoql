import http = require('http')
var _static = require('node-static')

var port = process.env.port || 8081;
var fileServer = new _static.Server();


http.createServer((req, res) => {
    req.addListener('end', function () {
        fileServer.serve(req, res);
    });

    req.resume();
}).listen(port);