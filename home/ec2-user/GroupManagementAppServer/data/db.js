var mysql = require('mysql');

exports.db = function(callback)
{
	var c = mysql.createConnection({
		host    : "localhost",
		database: "group_inventory_management_db",
		user    : "root"
	});
	callback(null, c);
}
