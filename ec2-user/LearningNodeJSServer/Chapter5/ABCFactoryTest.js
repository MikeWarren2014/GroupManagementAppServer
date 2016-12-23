var ABC = require('./ABCFactory.js');
var obj = new ABC();
obj.functionA(1,2);

console.log(JSON.stringify(new ABC(), null, '\t'));
console.log("ABC.language == " + ABC.language);