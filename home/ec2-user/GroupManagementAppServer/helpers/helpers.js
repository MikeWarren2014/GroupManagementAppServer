exports.missingData = function(what)
{
	return exports.makeError("missing_data",
		"You must include " + what);
}

exports.invalidData = function(what)
{
	return exports.makeError("invalid_data",
		"The following data is invalid: " + what);
}

exports.sendSuccess = function(res, data) {
	res.writeHead(200, { "Content-Type" : "application/json" });
	var output = { error: null, data: data };
	res.end(JSON.stringify(output, null, '\t') + '\n');
}

exports.sendFailure = function(res, serverCode, err) {
	console.log(err);
	var code = (err.code) ? err.code : err.name;
	res.writeHead(serverCode, { "Content-Type" : "application/json" });
	res.end(JSON.stringify({ error: code, message: err.message }, null, '\t') + '\n');
}

exports.makeError = function(err, msg)
{
	var e = new Error(err);
	e.code = msg;
	return e;
}

// to be called for invalid user/password combo
exports.authFailed = function()
{
	return exports.makeError("auth_failure",
		"Invalid username/password combo");
}

exports.httpCodeForError = function(err)
{
	switch (err.message) { 
		case "invalid_resource": return 404;
		case "invalid_data" : return 403;
		case "no_such_user" : return 403;
		case "auth_failure": return 401;
		
		console.log("*** Error needs HTTP response code: " + err.message);
		return 503;
	}
}

