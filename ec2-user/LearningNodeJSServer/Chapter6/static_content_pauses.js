var http = require('http'),
	path = require('path'),
	fs = require('fs');

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
	var DEBUG = false;
	if (DEBUG) console.log("file : " + file);
	var rs = fs.createReadStream(file.substring(1));
	var ct = contentTypeForFile(file.substring(1));
	response.writeHead(200, { "Content-Type" : ct });
	
	rs.on(
		'readable',
		function()
		{
			// read in data
			var data = rs.read();
			// if data cannot be written
			if (!(response.write(data)))
			{
				// read stream waits
				rs.pause();
			}
		}
	);

	// when response drains, read stream resumes
	response.on('drain',
		function()
		{
			rs.resume();
		}
	);
	
	rs.on(
		'end',
		function() 
		{
			response.end();
		}
	);

	rs.on(
		'error',
                function(e)
                {
                        response.writeHead(404, { "Content-Type" : "application/json" });
                        var out = { error: "not_found",
                                message: "'" + file + "' not found" };
                        response.end(JSON.stringify(out, null, '\t') + '\n');
//                      return; // why is this here?
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

var s = http.createServer(handleIncomingRequest);
s.listen(8080);
