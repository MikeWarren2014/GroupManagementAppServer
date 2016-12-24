var greet = require('./greeterModule');

var g = greet.create_greeter("en");
console.log(g.greet());
console.log(greet.hello_world());
console.log(greet.create_greeter("jp").greet());
console.log(greet);
console.log(greet.goodbye());

