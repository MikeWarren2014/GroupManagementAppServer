var async = require('async');

async.parallel({
	numbers: function (callback) {
		setTimeout(function () {
			callback(null, [ 1, 2, 3]);
		}, 1500);
	},
	strings: function (callback) {
		setTimeout(function() {
			callback(null, [ "A", "B", "C"]);
		}, 2000);
	}
},
function (err, results) {
	console.log(results);
});
