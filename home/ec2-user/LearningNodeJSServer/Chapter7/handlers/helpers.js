exports.version = "0.1.0";

exports.makeError = function(err, msg)
{
	var e = new Error(msg);
	e.code = err;
	return e;
}

exports.sendSuccess = function(response, data)
{
	response.writeHead(200, { "Content-Type" : "application/json" });
	var output = { error: null, data: data };
	response.end(JSON.stringify(output, null, '\t') + "\n");
}

exports.sendFailure = function(response, code, error)
{
	var code = (error.code) ? error.code : error.name;
	response.writeHead(code, { "Content-Type" : "application/json" });
	response.end(JSON.stringify({ error: code, message: error.message }, null, '\t') + "\n");
}

exports.invalidResource = function() { 
	return exports.makeError("invalid_resource",
		"the requested resource does not exist");
}

exports.noSuchAlbum = function() {
	return makeError("no_such_album",
		"The specified album does not exist");
}