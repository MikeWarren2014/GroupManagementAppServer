var http = require('http'),
	fs = require('fs'),
	path = require('path');


function handleIncomingRequest(request, response)
{
	console.log(request.url);
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
	}
}

function serveStaticFile(file, response)
{	
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
	fs.exists(file.substring(1), function(exists) {
		if (!exists)
		{
			response.writeHead(404, { "Content-Type" : "application/json" });
			var out = { error: "not_found",	
					message: "'" + file + " not found" };
			response.end(JSON.stringify(out, null, '\t') + "\n");
			return;
		}

		var rs = fs.createReadStream(file.substring(1));
		rs.on('error',
			function(e) { 
				response.end();
			}
		);
	
		
		// remember, files now start wtih '/'
		var ct = contentTypeForFile(file.substring(1));
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

var s = http.createServer(handleIncomingRequest);
s.listen(8080);
