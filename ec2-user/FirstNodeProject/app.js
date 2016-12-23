var express = require("express");
var app = express();

app.get("/", function(req, res) {
	res.send("<h1>EC2 test page</h1>");
	console.log("Page loaded...");
});

app.listen(8000);
