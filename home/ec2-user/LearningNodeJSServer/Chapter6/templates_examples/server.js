var http = require('http'),
	fs = require('fs'),
	path = require('path'), 
	url = require('url'),
	async = require('async');


function handleIncomingRequest(req, res)
{
	var DEBUG = true;
	/* console.log(request.url);
	if (request.method.toLowerCase() == 'get')
	{
		serveStaticFile(request.url, response);
	}
	else
	{
		response.writeHead(404, { "Content-Type" : "application/json" });
		var out = { error: "not_found",	
				message: "'" + request.url + "' not found" };
		response.end(JSON.stringify(out, null, '\t') + '\n');
	} */
	
	// parse query params into an object and get the path without them. (second param = true means parse the params)
	req.parsedURL = url.parse(req.url, true);
	if (DEBUG)
	{
		console.log("req.url == " + req.url);
		//console.log("req.parsedURL == ");
		//console.log(req.parsedURL);
	}
	var coreURL = req.parsedURL.pathname;
	
	// test this fixed url to see what they're asking for
	if (coreURL.substring(0,7) == '/pages/')
	{
		servePage(req, res);
	}
	else if (coreURL.substring(0, 11) == '/templates/')
	{
		serveStaticFile("templates/" + coreURL.substring(11), res);
	}
	else if (coreURL.substring(0, 9) == '/content/')
	{
		serveStaticFile("content/" + coreURL.substring(9), res);
	}
	else if (coreURL == '/albums.json')
	{
		handleListAlbums(req, res);
	}
	else if ((coreURL.substr(0, 7) == '/albums') && (coreURL.substr(coreURL.length - 5) == '.json'))
	{
		handleGetAlbum(req, res);
	}
	else 
	{
		console.log("coreURL == " + coreURL);
		if (coreURL.substr(0, 7) == '/YALApp')
			serveStaticFile(('/var/www/html/' + (coreURL === '/YALApp') ? '/YALApp/index.html' : coreURL), res, true);
		else if (coreURL !== '/favicon.ico')
			sendFailure(res, 404, invalidResource());
	}
}

function serveStaticFile(file, response, accessPersonalPage)
{	
	var DEBUG = true;
	if (DEBUG)
	{
		console.log("Requested filename: " + file);
	}
	var ACCESS_PERSONAL_PAGE = accessPersonalPage | false;
/*
	var rs = fs.createReadStream(file.substring(1));
	rs.on('error',	
		function(e) {
			console.log("oh no! Error!! " + JSON.stringify(e, null, '\t'));	
			res.end('');
		}
	);
	
	var ct = contentTypeForFile(file.substring(1));
	res.writeHead(200, { "Content-Type" : ct });
	rs.pipe(res);
*/
	
	// remember, files now start wtih '/'
	fs.exists(((ACCESS_PERSONAL_PAGE) ? file.substring(1) : file), 
	function(exists) {
		if (!exists)
		{
			response.writeHead(404, { "Content-Type" : "application/json" });
			var out = { error: "not_found",	
					message: "'" + file + " not found" };
			response.end(JSON.stringify(out, null, '\t') + "\n");
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

function handleListAlbums(req, res)
{
	loadAlbumList(function(err, albums) {
		if (err)
		{
			sendFailure(res, 500, err);
			return;
		}
		sendSuccess(res, { albums : albums });
	});
}

function handleGetAlbum(req, res) {
	// get the GET parameters
	var getp = req.parsedURL.query;
	var pageNum = getp.page ? getp.page : 0;
	var pageSize = getp.pageSize ? getp.pageSize : 1000;
	
	if (isNaN(parseInt(pageNum))) pageNum = 0;
	if (isNaN(parseInt(pageSize))) pageSize = 1000;
	
	// format of request is /albums/albumName.json
	var core_url = req.parsedURL.pathname;
	
	var albumName = core_url.substr(7, core_url.length - 12);
	loadAlbum(
		albumName,	
		pageNum,
		pageSize,
		function (err, albumContents) { 
			if (err && err.error == "no_such_album")
			{
				sendFailure(res, 404, err);
			}
			else if (err)
			{
				sendFailure(res, 500, err);
			}
			else
			{
				sendSuccess(res, { albumData: albumContents });
			}
		}
	);
}

function loadAlbumList(callback)
{
	fs.readdir(
		"albums",
		function(err, files)
		{
			if (err)
			{
				callback(makeError("file_error", JSON.stringify(err, null, '\t')));
				return;
			}
			
			var onlyDirectories = [];
			async.forEach(
				files,
				function(element, cb)
				{
					fs.stat(
						"albums/" + element,
						function(err, stats)
						{
							if (err)
							{
								cb({ error: "file_error", 
									message: JSON.stringify(err, null, '\t')});	
								return;
							}
							if (stats.isDirectory())
							{
								onlyDirectories.push({ name: element });
							}
							cb(null);
						}
					);
				},
				function (err) {
					callback(err, err ? null : onlyDirectories);
				}
			);
		}
	);
}

function loadAlbum(albumName, page, pageSize, callback)
{
	var DEBUG = true;
	if (DEBUG) console.log("albumName == " + albumName);
	// we will just assume that any directory in 'albums' directory is an album
	fs.readdir(
		"albums/" + albumName,
		function (err, files)
		{
			if (err)
			{
				if (err.code == "ENOENT")
				{
					callback(noSuchAlbum());
				}
				else
				{
					callback(makeError("file_error", JSON.stringify(err, null, '\t')));
				}
				return;
			}
			
			var onlyFiles = [];
			var path = "albums/" + albumName + "/";
			
			async.forEach(
				files,
				function(element, cb)
				{
					fs.stat(
						path + element,
						function (err, stats) 
						{
							if (err)
							{
								cb(makeError("file_error", JSON.stringify(err, null, '\t')));
								return;
							}
							if (stats.isFile())
							{
								var obj = { filename: element,
											desc: element };
								onlyFiles.push(obj);
							}
							cb(null);
						}
					);
				},
				function (err) {
					if (err)
					{
						callback(err);
					}
					else
					{
						// splice fails gracefully if params out of range
						var photos = onlyFiles.splice(page * pageSize, pageSize);
						var obj = { shortName: albumName, 
									photos: photos };
						callback(null, obj);
					}
				}
			);
		}
	);
}

function servePage(request, response)
{
	var DEBUG = true;
	// get the name of the page via the request
	var pageName = getPageName(request);
	if (DEBUG) console.log("pageName == " + pageName);
	// serve the file from basic.html, via fs
	fs.readFile(
		'./basic.html',
		function (err, contents) {
			if (err)
			{
				sendFailure(response, 500, err);
				return;
			}
			
			contents = contents.toString('utf8');
			
			// replace page name, and then dump ot output.
			contents = contents.replace('{{PAGE_NAME}}', pageName.split('.')[0]);
			response.writeHead(200, { "Content-Type" : "text/html" });
			response.end(contents);
		}
	);
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

function doRename(oldName, newName, callback)
{
	// rename album folder
	fs.rename('albums/' + oldName,
		'albums/' + newName,
		callback);
}

function makeError(err, msg)
{
	var e = new Error(msg);
	e.code = err;
	return e;
}

function sendSuccess(res, data) {
	res.writeHead(200, {"Content-Type" : "application/json"});
	var output = { error: null, data: data };
	res.end(JSON.stringify(output, null, '\t') + "\n");
}

function sendFailure(res, code, err) {
	var code = (err.code) ? err.code : err.name;
	res.writeHead(code, { "Content-Type" : "application/json" });
	res.end(JSON.stringify({ error: code, message: err.message }, null, '\t') + "\n");
}

function invalidResource()
{
	return makeError("no_such_album",
					 "The requested resource does not exist");
}

function noSuchAlbum()
{
	return makeError("no_such_album",
					 "The specified album does not exist");
}

function missingData(missing) {
    var msg = missing
        ? "Your request is missing: '" + missing + "'"
        : "Your request is missing some data.";
    return makeError("missing_data", msg);
}

function fileError(err) {
    var msg = "There was a file error on the server: " + err.message;
    return makeError("server_file_error", msg);
}

function badJSON() {
    return makeError("invalid_json",
                      "the provided data is not valid JSON");
}

function getPageName(req)
{
	var DEBUG = true;
	var coreURL = req.parsedURL.pathname;
	var parts = coreURL.split('/');
	if (DEBUG) console.log(parts);
	return parts[2];
}

function getAlbumName(req)
{
	var coreURL = req.parsedURL.pathname;	
	return coreURL.substr(7, coreURL.length - 12);
}

function getTemplateName(req)
{
	var coreURL = req.parsedURL.pathname;	
	return coreURL.substring(11);
}

var s = http.createServer(handleIncomingRequest);
s.listen(8080);
