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

exports.sendFailure = function(res, err) {
	console.log(err);
	var code = (err.code) ? err.code : err.name;
	res.writeHead(code, { "Content-Type" : "application/json" });
	res.end(JSON.stringify({ error: err, message: err.message }, null, '\t') + '\n');
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

