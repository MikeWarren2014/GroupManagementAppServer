exports.version = "0.0.1";

var helpers = require('./helpers.js'),
	users = require('./users.js'),
	User = require('./user.js');	
	
var async = require('async');
	
const BASIC = "basic user",
	INVENTORY_MANAGEMENT = "inventory",
	ADMIN = "admin";
	
// these constants will be either expanded upon or moved to another file
const NONE = '',
	VIEW = 'view',
	EDIT = 'edit';
	
// this object will be replaced by database table, which is to be read from
// tagName is name of page that will be served.
// privileges are currently as follows: view, edit
/* TODO: Implement change to tableTemplates: 
	Make tableTemplates an array of objects
	> first member: tableTemplate
	> second member: cellTemplate
*/
var userTypePrivileges = [
	{
		userType: BASIC,
		tabs    : [
			{
				tabName       : "groupMembers",
				displayName   : "View/Modify Group Members",
				tableTemplates: ["groupMemberRow"], 
				privileges    :  {
					view: true, 
					edit: false
				}//[ VIEW ] 
			},
			{
				tabName       : "groupAvailability",
				displayName   : "View Availability",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
				}
			},
			{
				tabName       : "inventory",
				displayName   : "View/Modify Inventory",
				tableTemplates: ["inventoryRow"], 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
				}
			},
			{
				tabName       : "reportedItems",
				displayName   : "View/Modify Reported Items",
				tableTemplates: NONE, 
				privileges    : NONE
			},
			{
				tabName       : "inventoryHistory",
				displayName   : "View Inventory History",
				tableTemplates: NONE, 
				privileges    : NONE
			},
			{
				tabName       : "externalLinks",
				displayName   : "View External Links",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
					
				}
			}
			
		]
		
	},
	{
		userType: INVENTORY_MANAGEMENT,
		tabs    : [
			{
				tabName       : "groupMembers",
				displayName   : "View/Modify Group Members",
				tableTemplates: ["groupMemberRow"], 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
				}
			},
			{
				tabName       : "groupAvailability",
				displayName   : "View Availability",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
				}
			},
			{
				tabName       : "inventory",
				displayName   : "View/Modify Inventory",
				tableTemplates: ["inventoryRow"], 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "reportedItems",
				displayName   : "View/Modify Reported Items",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "inventoryHistory",
				displayName   : "View Inventory History",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
				}
			},
			{
				tabName       : "externalLinks",
				displayName   : "View External Links",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW ] 
					view: true,
					edit: false
				}
			}
		]
			
	},
	{
		userType: ADMIN,
		tabs    : [
			{
				tabName       : "groupMembers",
				displayName   : "View/Modify Group Members",
				tableTemplates: ["groupMemberRow"], 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "groupAvailability",
				displayName   : "View Availability",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "inventory",
				displayName   : "View/Modify Inventory",
				tableTemplates: ["inventoryRow"], 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "reportedItems",
				displayName   : "View/Modify Reported Items",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "inventoryHistory",
				displayName   : "View Inventory History",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			},
			{
				tabName       : "externalLinks",
				displayName   : "View External Links",
				tableTemplates: NONE, 
				privileges    : { //[ VIEW, EDIT ] 
					view: true,
					edit: true
				}
			}
		]
	}
];
	
exports.profileInformation = function(req, res)
{
	var info = {
		userType     : req.session.userType,
		emailAddress : req.session.emailAddress,
		displayName  : req.session.displayName
	};
	info.tabMetaData = exports.profilePrivileges(req, res);
	// if user has no privileges
	if (!info.tabMetaData)
	{
		// they are forbidden on this site
		helpers.sendFailure(res, 
			403, 
			helpers.makeError("forbidden", 
				"You do not have access to this site. Contact " + 'admin@mikewarren.me' + " about it.")
		);
		return;
	}
	helpers.sendSuccess(res, info);
}

exports.profilePrivileges = function(req, res)
{
	/*var privileges = {
		view: [],
		edit: []
	};
	
	return privileges;*/
	var user = User.sampleUserByEmail(req.session.emailAddress);
	console.log("Fetched user by email: " + JSON.stringify(user, null, '\t'));
	// get all the tabs for the group
	// TODO: establish database connection
	// query for that would be thus: "SELECT GroupTabName FROM group_tabs WHERE GroupID = (SELECT GroupID FROM groups WHERE GroupName = 'nameOfGroup')"
	return exports.privilegeFor(user);
}

exports.privilegeFor = function(user, page) 
{
	if (!user) return null;	// should not really be needed
	var user_type; 
	// get user type
	user_type = user.userRole;
	return exports.privilegeForUserType(user_type, page);
}

exports.privilegeForUserType = function(userType, page)
{
	var privilegeObj = null;
	// TODO: establish connection to database
	if (User.connectedToDatabase)
	{
		
	}
	// for now, we disregard page variable...
	else
	{
		//...and just return the whole object element of userTypePrivileges corresponding to userType
		async.forEachSeries(
			userTypePrivileges,
			function (obj, callback)
			{
				if (userType == obj.userType)
				{
					privilegeObj = obj;
					return;
				}
				if (obj.userType == userTypePrivileges[userTypePrivileges.length - 1].userType)
				{
					callback(helpers.invalidData("user_type"));
					return;
				}
				
				callback(null);
			},
			function(err)
			{
				// do nothing?
			}
		);
		
	}
	console.log("privilegeObj == " + JSON.stringify(privilegeObj, null, '\t'));
	return privilegeObj;
} 

exports.tableData = function(req, res)
{
	// get name of table to fetch data for
	var tmplName = req.params.tableTemplateName;
	var tableData = [];
	if (tmplName == "groupMemberRow")
	{
		tableData = users.getAllUsers(req, res);
	}
	if (tmplName == "userRoles"){
		tableData = users.userRoleTemplateData(req, res);
		// here's where you associate privileges with the user types, at least for now
		// for every row
	}
	helpers.sendSuccess(res, tableData);
}