var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('client-sessions');	

var users = require('./helpers/users.js'),
	helpers = require('./helpers/helpers.js'),
	profileHandler = require('./helpers/profile.js');

var fs = require('fs'),
	path = require('path'),
	URL = require('url');
	
var https = require('https');

function handleIncomingRequest(req, res)
{
	var DEBUG = false;
	console.log("INCOMING REQUEST: " + req.method + " " + req.url);
	var questionMarkIndex = req.url.indexOf('?');
	var filename = req.url;
	if (questionMarkIndex != -1) filename = req.url.substr(0, questionMarkIndex);
	/*console.log("using url library: ");
	console.log(URL.format(req.url).pathname);*/
	serveStaticFile(filename,
		res);
	//serveStaticFile(req.url, res);
}


/* Function that simply sends the dependency specified by the URL, via response variable */
function sendDependency(url, response)
{
	if (url !== "/favicon.ico") response.sendFile("/var/www/html" + url);
}

var useSSL = true;
var privateKey = '', certificate = '', intermediate = '';

if (useSSL)
{
	privateKey   = fs.readFileSync('/etc/pki/tls/private/serverKey.key').toString();
	certificate  = fs.readFileSync('/etc/pki/tls/certs/2_mikewarren.me.crt').toString();
	intermediate = fs.readFileSync('/etc/pki/tls/certs/1_root_bundle.crt').toString();
}

var options = {
	key : privateKey,
	cert: certificate,
	ca  : intermediate
}

//app.use(favicon(__dirname + '/public/favicon.ico'));

app//.use(express.logger('dev'))
	.use(bodyParser.urlencoded({ extended: true }))
	.use(session({
	cookieName: 'session',
	secret: 'ckwtngqjqerrafourhpvi',
	duration: 30 * 60 * 1000,
	activeDuration: 15 * 60 * 1000,
	httpOnly: true,
	secure: true,
	ephemeral: true
}))
	.get("/json/profile.json", profileHandler.profileInformation)
	.get("/json/profile/:tableTemplateName.json", profileHandler.tableData)
	.get("/YALApp/*", 
		requirePageLogin,
		function(req, res)
		{
			handleIncomingRequest(req, res);
		}
	)
	.get("/YALApp", 
		function (req, res) {
			res.redirect('/YALApp/');
		}
	)
	.post('/service/login', users.login)
	.post('/service/logout', users.logout)
	.get('/serverTest', serverCheck)
	.get("/jQueryLib/*", handleIncomingRequest)
	.get("/asyncLib/*", handleIncomingRequest)
	.get("*",
		function(req, res)
		{
			
			var DEBUG = false;
			/*// TODO: Figure out the problem(s) with the following if-statement
			if ((DEBUG) && (req.url.search("phpmyadmin") == -1))
			{
				res.writeHead(200, {"Content-Type" : contentTypeForFile(req.url)});	// problem should be here...
				res.end("You requested the following URL: " + req.url);
				
			}
			else
			{
				console.log('req.url == ' + req.url);
				sendDependency(req.url, res);	
			}*/
			res.writeHead(404, { "Content-Type" : "application/json" });
			res.end(JSON.stringify(helpers.makeError("file_not_found",
					"The requested file cannot be accessed: " + req.url), null, '\t') + '\n');
		}
	);

if (useSSL)
{
	https.createServer(options, app).listen(8443);
	/*var otherApp = express().get('*', 
		function(req, res) 
		{ 
			//console.log("listening on port 8080"); 
			res.end("listening on port 8080");
		}
	);
	otherApp.listen(8080);*/
}
else
{
	app.listen(8080);
}

function serveStaticFile(file, res)
{
	var url = '/var/www/html' + file;
	if (url.charAt(url.length - 1) == '/' || url.lastIndexOf('.') == -1)
	{
		console.log(res.sendFile);
		res.sendFile(url + '/index.html');
		return;
	}
	res.sendFile(url);
}

function contentTypeForFile(file)
{
	var ext = path.extname(file);
	switch (ext.toLowerCase()) {
		case '.html' : return "text/html";
		case '.css' : return "text/css";
		case '.js' : return "text/javascript";
		case '.jpg' : case '.jpeg' : return "image/jpeg";
		default : return 'text/plain';
	}
}

function requirePageLogin(req, res, next)
{
	var DEBUG = false;
	if (DEBUG)
	{
		console.log("req.params == ");
		console.log(JSON.stringify(req.params, null, '\t'));
		console.log("req.url == " + req.url);
	}
	// if not on login page
	if (!(req.url) || (req.url.indexOf('login') == -1))
	{
		// if user is logged in
			/* NOTE: user is logged in iff there exists session, and it has loggedIn == true */
		if ((req.session) && (req.session.loggedIn))
		{
			// send control to next()
			next();
		}
		// otherwise
		else
		{
			// require login
			res.redirect('/YALApp/loginPage.html');
		}
	}
	else 
		next();
}

// this should run always
function serverCheck(req, res)
{
	res.writeHead(200, { "Content-Type" : "application/json" });
	res.end(JSON.stringify({"status" : "ok"}, null, '\t'));
}

