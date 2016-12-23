var express = require('express');
var app = express();

app.get('/', function(req,res)
	{
		res.end('hello worlds');
	}
);

app.listen(8080);
