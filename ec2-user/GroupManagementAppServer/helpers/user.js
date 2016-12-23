exports.version = "0.0.1";

var async = require('async'),
	bcrypt = require('bcrypt');
	
var helpers = require('./helpers.js');

function User(id, email, firstName, lastName, password, userType, phone, joinDate, deleted)
{
	var DEBUG = false;
	
    this.userID = id;
    this.email = email;
	this.firstName = firstName;
	this.lastName = lastName;
	this.phoneNumber = phone;
	this.joinDate = joinDate;
	this.deleted = deleted;
    var self = this;
	async.forEachSeries(
		User.userTypes,
		function(user_type, callback)
		{
			if (DEBUG)
				console.log("Now testing against: " + user_type);
			if (user_type == userType)
			{
				self.userRole = user_type;
				if (DEBUG) console.log("this.userRole == " + self.userRole);
				return;
			}
			if (user_type == User.userTypes[User.userTypes.length - 1])
			{
				callback(helpers.invalidData("user_role"));
				return;
			}
			callback(null);
		},
		function(err)
		{
			if (err)
			{
				if (DEBUG)
				{
					console.log("Error from constructor...");
					console.log(JSON.stringify(err, null, '\t') + "\n");
				}
			}
		}
	);
	if (password)
	{
		if (User.connectedToDatabase) this._password = password;
		else
		{
			this._password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
		}
	}
}

User.connectedToDatabase = false;
User.BASIC = "basic user";
User.INVENTORY_MANAGEMENT = "inventory";
User.ADMIN = "admin";
User.userTypes = [ User.BASIC, User.INVENTORY_MANAGEMENT, User.ADMIN ];
User.sampleUsers = [
	new User(
		0,
		"admin@mikewarren.me",
		"Mike",
		"Warren",
		"Sample0x50617373",
		User.ADMIN,
		"(317)909-0909",
		new Date(2015,1, 11)),
	new User(
		1,
		"kate123@yahoo.com",
		"Kate",
		"Manager",
		"noneofyourbusiness",
		User.INVENTORY_MANAGEMENT,
		"(317)555-5555",
		new Date(2015, 12, 6)),
	new User(
		2,
		"sample.user@gmail.com",
		"Basic",
		"User",
		"basic",
		User.BASIC,
		"(317)666-6666",
		new Date(2016, 1, 1))
];
User.sampleUserByEmail = function(email){ 
	var user = null;
	async.forEachSeries(User.sampleUsers,
		function (curr_user, callback)
		{
			if (email == curr_user.email)
			{
				user = curr_user;
				return;
			}
			// if we have hit the last element, email provided is invalid
			if (curr_user.email == User.sampleUsers[User.sampleUsers.length - 1].email)
			{
				callback(helpers.invalidData('email_address'));
				return;
			}
			callback(null);
		},
		function (err)
		{
			console.log("The following error occurred when searching for sample user by email: ");
			console.log(JSON.stringify(err, null, '\t'));
		}
	);
	return user;
};

User.prototype.userID = 0;
User.prototype.email = null;
User.prototype.displayName = null;
User.prototype._password = null;
User.prototype.userRole = User.BASIC;
User.prototype.deleted = false;

User.prototype.checkPassword = function (password, callback)
{
	bcrypt.compare(password, this._password, callback);	
}
User.prototype.responseObject = function() {
	return {
		id: this.userID,
		displayName: this.firstName + ' ' + this.lastName,
		email: this.email,
		phone: this.phoneNumber, 
		joinDate: this.joinDate,
		userType: this.userRole
	};
}

module.exports = User;