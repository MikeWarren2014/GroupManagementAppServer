var http = require('http');
var qs = require('querystring');
 
function handleIncomingRequest(req, res)
{
	var body = '';
	req.on(
		'readable',
		function()
		{
			var d = req.read();
			if (d)
			{
				if (typeof d == 'string')
				{
					body += d;
				}
				else if (typeof d == 'object' && d instanceof Buffer)
				{
					body += d.toString('utf8');
				}
			}
		}
	);
	
	req.on(
		'end',
		function()
		{
			if (req.method.toLowerCase() == 'post')
			{
				var post_data = qs.parse('body');
				console.log(post_data);
			}
			res.writeHead(200, { "Content-Type" : "application/json" });
			res.end(JSON.stringify( { error: null }, null, '\t') + "\n");
		}
	);
}

var s = http.createServer(handleIncomingRequest);
s.listen(8080);