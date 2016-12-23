var helpers = require('./helpers.js'),
	async = require('async'),
	fs = require('fs');

exports.listAlbums = function(req, res)
{
	loadAlbumList(function(err, albums)
	{
		if (err)
		{
			helpers.sendFailure(res, 500, err);
			return;
		}
		helpers.sendSuccess(res, { albums: albums });
	});
}

exports.albumByName = function(req, res)
{
	// get the get parameters
	var getParameters = req.query;
	var pageNumber = getParameters.page ? getParameters.page : 0;
	var pageSize = getParameters.pageSize ? getParameters.pageSize : 1000;
	
	// make sure that pageNumber,pageSize are numbers
	if (isNaN(parseInt(pageNumber))) pageNumber = 0;
	if (isNaN(parseInt(pageSize))) pageSize = 1000;
	
	// format of request is /albums/albumName.json
	var albumName = req.params.albumName;
	loadAlbum(albumName,
		pageNumber,
		pageSize,
		function (err, contents)
		{
			if (err)
			{
				if (err.error == "no_such_album")
				{
					helpers.sendFailure(res, 404, err);
				}
				else
				{
					helpers.sendFailure(res, 500, err);
				}
			}
			else
			{
				helpers.sendSuccess(res, { albumData: contents });
			}
		}
	);
}
	
function loadAlbumList(callback)
{
	fs.readdir(
		"albums",
		function(err, files)
		{
			if (err)
			{
				callback(helpers.makeError("file_error", JSON.stringify(err, null, '\t')));
				return;
			}
			
			var onlyDirectories = [];
			async.forEach(
				files,
				function(element, cb)
				{
					fs.stat(
						"albums/" + element,
						function(err, stats)
						{
							if (err)
							{
								cb(helpers.makeError("file_error", JSON.stringify(err, null, '\t')));	
								return;
							}
							if (stats.isDirectory())
							{
								onlyDirectories.push({ name: element });
							}
							cb(null);
						}
					);
				},
				function (err) {
					callback(err, err ? null : onlyDirectories);
				}
			);
		}
	);
}
	
function loadAlbum(albumName, page, pageSize, callback)
{
	var DEBUG = true;
	if (DEBUG) console.log("albumName == " + albumName);
	// we will just assume that any directory in 'albums' directory is an album
	fs.readdir(
		"albums/" + albumName,
		function (err, files)
		{
			if (err)
			{
				if (err.code == "ENOENT")
				{
					callback(helpers.noSuchAlbum());
				}
				else
				{
					callback(helpers.makeError("file_error", JSON.stringify(err, null, '\t')));
				}
				return;
			}
			
			var onlyFiles = [];
			var path = "albums/" + albumName + "/";
			
			async.forEach(
				files,
				function(element, cb)
				{
					fs.stat(
						path + element,
						function (err, stats) 
						{
							if (err)
							{
								cb(helpers.makeError("file_error", JSON.stringify(err, null, '\t')));
								return;
							}
							if (stats.isFile())
							{
								var obj = { filename: element,
											desc: element };
								onlyFiles.push(obj);
							}
							cb(null);
						}
					);
				},
				function (err) {
					if (err)
					{
						callback(err);
					}
					else
					{
						// splice fails gracefully if params out of range
						var photos = onlyFiles.splice(page * pageSize, pageSize);
						var obj = { shortName: albumName, 
									photos: photos };
						callback(null, obj);
					}
				}
			);
		}
	);
}