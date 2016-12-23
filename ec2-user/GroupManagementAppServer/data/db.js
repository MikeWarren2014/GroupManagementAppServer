var mysql = require('mysql');

exports.db = function(callback)
{
	var c = mysql.createConnection({
		host: "group-inventory-management-db.cu8hvhstcity.us-west-2.rds.amazonaws.com",
		database: "group_inventory_management_db",
		user: "HeadAdmin", 
		password: "group696e76656e746f727961646d696e"
	});
	callback(null, c);
}