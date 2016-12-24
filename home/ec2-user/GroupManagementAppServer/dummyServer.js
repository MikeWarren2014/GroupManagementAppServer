var fs = require('fs');
var https = require('https');
var app = require('express')();
var options = {
   key  : fs.readFileSync('/etc/pki/tls/private/serverKey.key', 'utf8'),
   cert : fs.readFileSync('/etc/pki/tls/certs/2_mikewarren.me.crt', 'utf8'),
   ca   : fs.readFileSync('/etc/pki/tls/certs/1_root_bundle.crt', 'utf8')
};

app.get('/', function (req, res) {
   res.send('Hello World!');
});

https.createServer(options, app).listen(8443, function() {
	console.log(JSON.stringify(options, null, '\t'));
});
/*
var http = require('http');
var app = require('express')();

app.get('/', function (req, res) {
   res.send('Hello World!');
});

http.createServer(app).listen(8080, function () {
   console.log('Started!');
}); */