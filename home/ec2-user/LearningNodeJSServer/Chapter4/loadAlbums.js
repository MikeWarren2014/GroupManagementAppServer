var http = require('http'), 
	fs = require('fs'),
	url = require('url');
	
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
			(function iterator(i)
			{
				if (i == files.length)
				{
					callback(null, onlyDirectories);
					return;
				}
				fs.stat(
					"albums/" + files[i],
					function(err, stats)
					{
						if (err)
						{
							callback(makeError("file_error"), JSON.stringify(err, null, '\t'));	
							return;
						}
						if (stats.isDirectory())
						{
							var obj = { name: files[i] };
							onlyDirectories.push(obj);
						}
						iterator(i + 1);
					}
				);
			})(0);
		}
	);
}

function loadAlbum(albumName, page, pageSize, callback)
{
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
					callback(makeError("file_error"), JSON.stringify(err, null, '\t'));
				}
				return;
			}
			
			var onlyFiles = [];
			var path = "albums/" + albumName + "/";
			
			(function iterator(index) 
			{
				if (index == files.length) {
					var ps;
					// splice fails gracefully if params out of range
					ps = onlyFiles.splice(page * pageSize, pageSize);
					var obj = { short_name: albumName, 
								photos: ps };
					callback(null, obj);
					return;
				}
				fs.stat(
					path + files[index],
					function (err, stats) 
					{
						if (err)
						{
							callback(makeError("file_error", JSON.stringify(err, null, '\t')));
							return;
						}
						if (stats.isFile())
						{
							var obj = { filename: files[index],
										desc: files[index] };
							onlyFiles.push(obj);
						}
						iterator(index + 1);
					}
				);
			})(0);
		}
	);
}

function handleIncomingRequest(request, response)
{
	/*var dottedLine = "------------------------------------------------------------------------";
	console.log(dottedLine);
	console.log(request);
	console.log(dottedLine);
	console.log(response);
	console.log(dottedLine);
	response.writeHead(200, { "Content-Type" : "application/json" });
	response.end(JSON.stringify( { error: null }, null, '\t') + "\n");
	*/
	request.parsed_url = url.parse(request.url, true);
	var core_url = request.parsed_url.pathname;
	
	console.log("INCOMING REQUEST: " + request.method + " " + request.url);
	if ((core_url == '/albums.json') & (request.method.toLowerCase() == "get"))
	{
		handleListAlbums(request, response);
	}
	else if ((core_url.substr(core_url.length - 12) == '/rename.json') && (request.method.toLowerCase() == 'post'))
	{
		handleRenameAlbum(request, response);	// not implemented yet
	}
	else if ((core_url.substr(0,7) == '/albums') && (core_url.substr(core_url.length - 5) == '.json'))
	{
		handleGetAlbum(request, response);
	}
	else 
	{
		sendFailure(response, 404, invalidResource());
	}
}

function handleListAlbums(req, res)
{
	loadAlbumList(function (err, albums) {
		if (err) {
			sendFailure(res, 500, err);
			return;
		}
		
		sendSuccess(res, { albums: albums });
	});
}

function handleGetAlbum(req, res) {
	// get the GET parameters
	var getp = req.parsed_url.query;
	var page_num = getp.page ? getp.page : 0;
	var page_size = getp.page_size ? getp.page_size : 1000;
	
	if (isNaN(parseInt(page_num))) page_num = 0;
	if (isNaN(parseInt(page_size))) page_size = 1000;
	
	// format of request is /albums/album_name.json
	var core_url = req.parsed_url.pathname;
	
	var album_name = core_url.substr(7, core_url.length - 12);
	loadAlbum(
		album_name,	
		page_num,
		page_size,
		function (err, album_contents) { 
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
				sendSuccess(res, { album_data: album_contents });
			}
		}
	);
}

function handleRenameAlbum(req, res)
{
	var DEBUG = true;
	// 1. get album name from URL 
	var core_url = req.parsed_url.pathname;
	var parts = core_url.split('/');
	if (parts.length != 4)
	{
		sendFailure(res, 404, invalidResource(core_url));
	}
	var albumName = parts[2];
	
	// 2. get POST data for request. this will have the JSON for new album name
	var jsonBody = '';
	req.on(
		'readable',
		function()
		{
			var d = req.read();
			if (d)
			{
				if (typeof d == 'string')
				{
					jsonBody += d;
					if (DEBUG) console.log(d);
				}
				else if ((typeof d == 'object') && (d instanceof Buffer))
				{
					jsonBody += d.toString('utf8');
					if (DEBUG) console.log(d.toString('utf8'));
				}
			}
		}
	);
	
	// 3. when we have all the post data, make sure we have valid data and then attempt rename.
	req.on(
		'end',
		function()
		{
			// did we get body?
			if (jsonBody)
			{
				try
				{
					var album_data = JSON.parse(jsonBody);
					if (!album_data.albumName)	// camel case or snake case?
					{
						sendFailure(res, 403, missingData('albumName'));
						return;
					}
				}
				catch (e)
				{
					// got body, but no valid json
					if (DEBUG) sendFailure(res, 403, makeError("invalid_json", "contents of jsonBody:\n" + jsonBody));
					else sendFailure(res, 403, badJSON());	
					return;
				}
				// 4. Perform rename!
				doRename(
					albumName,	// old
					album_data.albumName,	// new
					function (err,results)
					{
						if (err && err.code == "ENOENT")
						{
							sendFailure(res, 403, noSuchAlbum());
							return;
						}
						else if (err)
						{
							sendFailure(res, 500, fileError(err));	
							return;
						}
						sendSuccess(res, null);
					}
				);
			}
			else 
			{
				// didn't get body
				if (DEBUG) sendFailure(res, 403, makeError("invalid_json", "JSON body missing"));
				else sendFailure(res, 403, badJSON());
				res.end();
			}
		}
	);
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
					 "The rquested resource does not exist");
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

var s = http.createServer(handleIncomingRequest);
s.listen(8080);
