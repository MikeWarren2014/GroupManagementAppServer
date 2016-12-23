var User = require('./user.js');
var assert = require('assert');
console.log(JSON.stringify(User.sampleUserByEmail('nothing@dontbother.com'), null, '\t'));	// should output 'null'
{
for (var i = 0; i < User.sampleUsers.length; i++)
	console.log(JSON.stringify(User.sampleUserByEmail(User.sampleUsers[i].email), null, '\t')); 
}
console.log(JSON.stringify(User.sampleUserByEmail('admin@mikewarren.me'), null, '\t'));