var helpers = require('./helpers.js'),
	fs = require('fs');
	
exports.version = "0.1.0";

exports.generate = function(req, res)
{
	var page = req.params.pageName;
	
	fs.readFile(
		'basic.html',
		function (err,contents){
			if (err)
			{
				helpers.sendFailure(res, 500, err);
				return;
			}
			contents = contents.toString('utf8');
			
			// replace page name and then dump to output
			contents = contents.replace("{{PAGE_NAME}}", page.split('.')[0]);
			res.writeHead(200, { "Content-Type" : "text/html"});
			res.end(contents);
		}
	);
	
	
}