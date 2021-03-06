var express = require('express'),
    https = require('https'),
    fs = require('fs');

var privateKey = fs.readFileSync('certs/privkey.pem').toString();
var certificate = fs.readFileSync('certs/newcert.pem').toString();

var options = {
    key : privateKey,
    cert : certificate
}
var app = express();

app.get("*", function (req, res) {
      res.end("Thanks for calling securely!\n");
});


// start server
https.createServer(options, app).listen(8443, function(){
    console.log("Express server listening on port " + 8443);
});