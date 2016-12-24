var fs = require('fs'),
	album = require('./album.js');	// album.js doesn't exist yet

exports.version = "1.0.0";

exports.albums = function(root, callback)
{
	// we will just assume any directory in our 'albums' subfolder is album
	fs.readdir(
		root + "/albums",
		function (err, files)
		{
			if (err)
			{
				callback(err);
				return;
			}
		
			var albumList = [];

			(function iterator(index)
			{
				if (index == files.length)
				{
					callback(null, albumList);
					return;
				}
				
			fs.stat(
				root + "albums/" + files[index],
				function (err, stats)
				{
					if (err)
					{
						callback({ error : "file_error",	
							message : JSON.stringify(err, null, '\t') });
						return;
					}
					if (stats.isDirectory())
					{
						var p = root + "albums/" + files[index];
						albumList.push(album.createAlbum(p));
					}
					iterator(index + 1);	
				}
			);
			})(0);
		}
	);
};	
