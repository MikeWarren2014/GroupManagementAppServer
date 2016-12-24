var async = require('async');

async.series({
	numbers : function (callback) {
		setTimeout(function() {
			callback(null, [1, 2, 3]);
		}, 1500);
	},
	strings: function (callback) {
		setTimeout(function() {
			callback(null, [ "a", "b", "c"]);
		}, 200);
	}
}, 
function (err, results) {
	console.log(results);
});
