var express = require('express');
var app = express();

var path = require('path'),
	fs = require('fs'),
	helpers = require('./handlers/helpers.js'),
	pageHandler = require('./handlers/pages.js'),
	albumHandler = require('./handlers/albums.js');
	
app.get('/v1/albums.json', albumHandler.listAlbums);
app.get('/v1/albums/:albumName.json', albumHandler.albumByName);
app.get('/albums/:albumName/:filename', function(req, res) {
	serveStaticFile('albums/' + req.params.albumName + '/' + req.params.filename, res);
});
app.get('/content/:filename', function(req, res) {
	serveStaticFile('content/' + req.params.filename, res);
});
app.get('/templates/:templateName', function (req, res) {
	serveStaticFile('templates/' + req.params.templateName, res);
});
app.get('/pages/:pageName', pageHandler.generate);
app.get('/pages/:pageName/:subPage', pageHandler.generate);
app.get('*', fourOhFour);


function fourOhFour(req, res) {
	res.writeHead(404, { "Content-Type" : "application/json"});
	res.end(JSON.stringify(helpers.invalidResource(), null, '\t') + "\n");
}

function serveStaticFile(file, response, accessPersonalPage)
{	
	var DEBUG = true;
	if (DEBUG)
	{
		console.log("Requested filename: " + file);
	}
	var ACCESS_PERSONAL_PAGE = accessPersonalPage | false;

	// remember, files now start wtih '/'
	fs.exists(((ACCESS_PERSONAL_PAGE) ? file.substring(1) : file), 
	function(exists) {
		if (!exists)
		{
			response.writeHead(404, { "Content-Type" : "application/json" });
			var out = { error: "not_found",	
					message: "'" + file + " not found" };
			response.end(JSON.stringify(helpers.invalidResource(), null, '\t') + "\n");
			return;
		}

		var rs = fs.createReadStream(((ACCESS_PERSONAL_PAGE) ? file.substring(1) : file));
		rs.on('error',
			function(e) { 
				response.end();
			}
		);
	
		
		// remember, files now start wtih '/'
		var ct = contentTypeForFile(((ACCESS_PERSONAL_PAGE) ? file.substring(1) : file));
		response.writeHead(200, { "Content-Type" : ct });
		// pipe() shuffles data from object it is member of, to argument
		rs.pipe(response);
	});
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

// these two helpers never get used...
function getAlbumName(req) { return req.params.albumName; }
function getTemplateName(req) { return req.params.templateName; }

app.listen(8080);
