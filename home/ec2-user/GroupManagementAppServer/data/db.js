var mysql = require('mysql');

exports.db = function(callback)
{
	var c = mysql.createConnection({
		
	});
	callback(null, c);
}
