exports.version = "0.0.1";

var async = require('async'),
	bcrypt = require('bcrypt');
	
var helpers = require('./helpers.js');

function User(id, email, displayName, password, deleted)
{
	this.userID = id;
	this.email = email;
	this.displayName = displayName;
	var self = this; // save this...
	if (User.connectedToDatabase) this._password = password;
	else
	{
		bcrypt.genSalt(10, function (err, salt) {
			// this, for some reason, isn't getting called. Literally, I never see "I'm here"
			console.log("I'm here...");
			bcrypt.hash(password, salt, function (err, hash) { 
				if (!err)
				{
					//..for this function
					self._password = hash;
					console.log("this._password == " + self._password);
				}
				else
				{
					console.log("Error occurred: ");
					console.log(err);
				}
			})
		});
		//this._password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
	}
	//this._password = password;
	this.deleted = deleted;
}

User.connectedToDatabase = false;

User.prototype.userID = 0;
User.prototype.email = null;
User.prototype.displayName = null;
User.prototype._password = null;
User.prototype.deleted = false;

User.prototype.checkPassword = function (password, callback)
{
	bcrypt.compare(password, this._password, callback);	// returns false
}
User.prototype.responseObject = function() {
	return {
		id: this.userID,
		email: this.email,
		displayName: this.displayName
	};
}

exports.login = function (req, res) {
	var dblessPrototype = true;
	// get email address from req.body, trim it and lowercase it
	var email = req.body.emailAddress ? 
		req.body.emailAddress.trim().toLowerCase() :
		"";
	// begin the login process
	async.waterfall([
		// prelimninary verification: make sure email,password are not empty, and that email is of valid format
		function(cb) 
		{
			// if no email address
			if (!email)
			{
				// send error via cb
				cb(helpers.missingData("email_address"));
			}
			// if '@' not found in email address
			else if (email.indexOf('@') == -1)
			{
				// then email address is invalid
				cb(helpers.invalidData("email_address"));
			}
			// if password is missing from req.body
			else if (!req.body.password)
			{
				// tell next function about that
				cb(helpers.missingData("password"));
			}
			// we are ready to move on otherwise
			else cb(null);
		},
		// TODO: lookup by email address
		// check the password
		function (cb)
		{
			
			var u;
			if (dblessPrototype)
			{
				u = new User(0, 
					"admin@mikewarren.me",
					"SampleAdmin",
					"Sample0x50617373");
			}
			else 
			{
				u = new User(userData);
			}
			u.checkPassword(req.body.password, 
				function(err,res)
				{
					if (err)
					{
						console.log("error occurred with password comparison: " + err);
					}
					cb(err, (err));	// taking advantage of truthiness
					return res;
				}
			);
			//cb(null, ok);
			
		},
		// time to set status of authenticiation
		function (authOK, cb)
		{
			if (!authOK)
			{
				cb(helpers.authFailed());
				return;
			}
			
			// set status of authenticiation in req.session
			req.session.loggedIn = true;
			req.session.emailAddress = req.body.emailAddress;
			req.session.loggedInTime = new Date();
			cb(null, true);
		}
	],
	function (err, results)
	{
		if (err)
		{
			console.log(JSON.stringify(err, null, '\t'));
			if (err.code != "already_logged_in")
			{
				helpers.sendFailure(res, 500, err);
				console.log("Already logged in...");
			}
		}
		else
		{
			helpers.sendSuccess(res, { loggedIn: true });
			console.log("Log in successful...");
		}
	});
	
}
