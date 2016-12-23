exports.version = "0.0.2";

var async = require('async'),
	bcrypt = require('bcrypt'),
	equal = require('deep-equal');
	
var helpers = require('./helpers.js'),
	User = require('./user.js');

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
		function(cb)
		{
			if (dblessPrototype)
			{
				// TODO: lookup by email address in Users.sampleUsers
				async.forEachSeries(User.sampleUsers,
					function(sampleUser, callback)
					{
						if (sampleUser.email == email)
						{
							return;
						}
						// TODO: fix this so that it compares two Users accurately
						//if (sampleUser === User.sampleUsers[User.sampleUsers.length - 1])
						//if (sampleUser.email == User.sampleUsers[User.sampleUsers.length - 1].email)
						if(equal(sampleUser, User.sampleUsers[User.sampleUsers.length - 1]))
						{
							callback(helpers.invalidData("email_address"));
							return;
						}
						callback(null);
					},
					function(err)
					{
						if (err)
							cb(err);
					}
				);				
			}
			cb(null);
		},
		// check the password
		function (cb, userData)
		{
			if (typeof(cb) !== 'function')
			// cb,userData in wrong order. reverse them
			{
				var temp = cb;
				cb = userData;
				userData = temp;
			}
			var u;
			// if we don't have database up
			if (dblessPrototype)
			{
				var authOK;
				// TODO: implement lookup in "database"
				// find user by email specified
				u = User.sampleUserByEmail(email);
				// TODO: find better way of doing this
				setTimeout(function () {
					console.log("cb == " + cb);
					console.log(u);
					// if there is a user to check password against
					if (u)
					{
						// check that password
						u.checkPassword(req.body.password, function(err, res) {
							var response = false;
							if (err) 
							{
								console.log('err: ' + err);
							} 
							else 
							{
								console.log('result of comparison: ' + res);
								if (res)
								{
									response = u.responseObject();
								}
								// Move on
								cb(err, response);
							}
							return res;
						  }
						);
					}
					// otherwise
					else
					{
						// user doesn't exist. Flag that.
						console.log('User doesn\'t exist');
						cb(helpers.invalidData('email_address'));
					}
				}, 1000);
			}
			// otherwise
			else
			{
				// use data from database to construct User
				u = new User(userData);
				u.checkPassword(req.body.password, cb);
			}			
		},
		
		// time to set status of authenticiation
		function (authResponse, cb)
		{
			if (!authResponse)
			{
				cb(helpers.authFailed());
				return;
			}
			// authResponse is a User object, with a userType. Write that in req.session
			req.session.userType = authResponse.userType;
			req.session.displayName = authResponse.displayName;
			// set status of authenticiation in req.session
			req.session.loggedIn = true;
			req.session.emailAddress = req.body.emailAddress;
			req.session.loggedInTime = new Date();
			cb(null, true);
		}
	],
	function (err, results)
	{
		if ((err) && (err.code != "already_logged_in"))
		{
			console.log(JSON.stringify(err, null, '\t'));
			helpers.sendFailure(res, helpers.httpCodeForError(err), err);
		}
		else
		{
			helpers.sendSuccess(res, 
				{ 
					loggedIn: true,
					targetURL: '/YALApp/test.html'
				});
			console.log("Log in successful...");
		}
	});
	
}

// might want to revise this
exports.logout = function(req, res)
{
	req.session.reset();
	console.log('Logging out...');
	helpers.sendSuccess(res,
		{ 
			loggedIn: false,
			targetURL: '/YALApp/loginPage.html'
		}
	);
}

function test(email, name, pass, type)
{
	try
	{
		// name contains ' '. Tokenize it into first,last
		var names = name.split(' '),
			first = names[0],
			last = names[1];
		var a = new User(Math.round(Math.random() * 32),
			email, 
			first,
			last, 
			pass, 
			type
		);
		console.log("Test user created: " + JSON.stringify(a.responseObject(), null, '\t') + "\n");
		console.log("User._password == " + a._password);
		console.log("\n");
	}
	catch (e)
	{
		console.log("User could not be created.\n" + JSON.stringify(e, null, '\t') + "\n");
	}
}
/*
// performing tests on userType feature
	// test case number 1: userType matches first possible element in User.userTypes
	test("adam.smith@yahoo.com", 
		"Adam Smith",
		"econ4lyfe",
		User.BASIC);
	// test case number 2: userType matches any other element in User.userTypes
	test("bob.builder@gmail.com",
		"Bob the Builder",
		"ICanBuiltIt",
		User.ADMIN);
	// test case number 3: userType is invalid
	test("hack2morrow@obscuresite.com",
		"Legion",
		"Expect us",
		"haxxor leet");
*/	

exports.getAllUsers = function(req, res)
{
	var allUserData = [];
	if (User.connectedToDatabase)
	{
		
	}
	else
	{
		// load all users
		var allUsers = User.sampleUsers;
		// for each user, generate row data
		async.forEachSeries(
			allUsers,
			function(user, callback)
			{
				var row = {};
				row.rowID = user.userID;
				row.isTheUser = (user.email == req.session.emailAddress);
				/*row.cellsData = [];
				// this isn't working. find another implementation.
				for (var key in user.responseObject())
				{
					if (key != 'id')
					{
						if (key == 'displayName')
						{
							row.cellsData.push({ "firstName" : user.firstName },
								{ "lastName" : user.lastName });
						}
						else 
						{
							//row.cellsData.push(user.responseObject().key);
							row.cellsData.push({ key : user.responseObject().key });
						}
					}
				}*/
				// clone user.responseObject()
				var clone = user.responseObject();
				// delete id property
				delete clone.id;
				// for every property of the clone
				for (var key in clone)
				{
					// if the property is named displayName
					if (key == 'displayName')
					{
						// create firstName,lastName properties
						// write firstName,lastName to those
						clone.firstName = user.firstName;
						clone.lastName = user.lastName;
					}
					// otherwise, if the property name contains "Date" or "date"
					else if (key.toLowerCase().indexOf('date') !== -1)
					{
						// turn the data there to a locale string
						clone[key] = clone[key].toLocaleDateString();
					}
					// wrap an object around the property
				}
				// clone is row.cellsData
				row.cellsData = clone;
				allUserData.push(row);
				callback(null);
			},
			function (err)
			{
				if (err)
				{
					console.log("Error occurred with fetching data for all users: " + 
						JSON.stringify(err, null, '\t'));
				}
			}
		);
	}
	return allUserData;
}

exports.userRoleTemplateData = function(req, res)
{
	var data = {};
	// get all user types
	data.roles = User.userTypes;
	// TODO: clone user types and wrap all members in an object (with each member being the roleName of that object)
	data.elementName = "Roles";
	data.theRole = req.session.userType;
	data.isTheRole = function() {
		return function(text, render) {
			return render(text) == data.theRole ? ' selected' : ''
		}
	}
	return data;
}