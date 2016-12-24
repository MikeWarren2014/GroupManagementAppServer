var fs = require('fs'),
	async = require('async');

function loadFileContents(path, callback)
{
	async.waterfall([
		function (callback)
		{
			fs.open(path, 'r', callback);
		},
		// file handle f was passed to callback at the end of the fs.open function call. async passes all params along.
		function (f, callback)
		{
			fs.fstat(f, function (err, stats) {
				if (err)
				{
					// abort and go straight to resulting function
					callback(err);
				}
				else
				{
					// f,stats passed to next function in waterfall
					callback(null, f, stats);
				}
			});
		},
		function (f, stats, callback)
		{
			if (stats.isFile())
			{
				var b = new Buffer(10000);
				fs.read(f, b, 0, 10000, null, function (err, br, buf) {
					if (err) callback(err);
					// f and string are passed to next function in waterfall
					else callback(null, f, b.toString('utf8', 0, br));
				});
			}
			else 
			{
				callback({ error: "not_file",
					message: "Can't load directory" });
			}
		},
		function (f, contents, callback)
		{
			fs.close(f, function (err) {
				if (err) callback(err);
				else callback(null, contents);
			});
		}
	],
	// this function is called after all have executed in success, or as soon as there is error.
	function (err, fileContents){
		callback(err, fileContents);
	});
}