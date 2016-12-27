var pool = require('generic-pool');
var async = require('async');
var mysql = require('mysql');

var host = "localhost",
	database = "root",
	user = "",
	password = "";
	
var dbClient; 

async.waterfall([
	// 1. establish connection to database
	function (callback) {
		console.log("Connecting to database " + database + "...");
		dbClient = mysql.createConnection({
			host: host,
			user: user,
			password: password,
			database: database,
			port: 3306
		});
		/*setTimeout(function() {
			dbClient.connect();
			console.log("connected. Proceeding to next phase...");
			callback(null);
		}, 5000);*/
		console.log("connected. Proceeding to next phase...");
		dbClient.connect(callback);
	},
	// 2. select all from a table (let's go for locations)
	function (results, cb)
	{
		var query = "SELECT * FROM locations"
		console.log("running query \"" + query + "\"...");
		/*setTimeout(
			function() {
				dbClient.query(query, cb);	
				//cb(null);
			},
			5000);*/
		dbClient.query(query, cb);
	},
	
	function (rows, fields, callback)
	{
		
		console.log("fields == ");
		console.log(fields);
		for (var i = 0; i < rows.length; i++)
		{
			console.log("rows[" + i + "] == " + JSON.stringify(rows[i], null, '\t'));
		}
		callback(null);
	}
	
	
	
], function (err, results) {
	if (err)
	{
		console.log("An error occurred...");
		console.log(err);
	}
	else
	{
		console.log("Everything successfully completed!");
	}		
	dbClient.end();
})
