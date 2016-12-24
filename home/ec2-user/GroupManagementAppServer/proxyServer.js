var fs = require('fs'),
	http = require('http'),
	https = require('https'),
	httpProxy = require('http-proxy');
	
var options = {
	key : fs.readFileSync('/etc/pki/tls/private/serverKey.key').toString(),
	cert: fs.readFileSync('/etc/pki/tls/certs/2_mikewarren.me.crt').toString(),
	ca  : fs.readFileSync('/etc/pki/tls/certs/1_root_bundle.crt').toString()
}

console.log("httpProxy == " + JSON.stringify(httpProxy, null, '\t'));

var proxy = httpProxy.createProxyServer({
	target: {
		host: 'mikewarren.me',
		port: 8080
	}
});

https.createServer(options, function(req, res) {
	proxy.proxyRequest(req, res);
}).listen(8443);