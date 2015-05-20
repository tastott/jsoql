import http = require('http')
import fs = require('fs')
var _static = require('node-static')
var browserify = require('browserify')


var browserifyBundle = browserify();
browserifyBundle.add('./app.js');
browserifyBundle.bundle().pipe(fs.createWriteStream('./app-browser.js'));

var port = process.env.port || 8081;
var fileServer = new _static.Server();


http.createServer((req, res) => {
    req.addListener('end', function () {
        fileServer.serve(req, res);
    });

    req.resume();
}).listen(port);