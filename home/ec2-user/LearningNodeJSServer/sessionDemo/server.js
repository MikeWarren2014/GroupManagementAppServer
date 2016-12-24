var express = require('express');
var session = require('client-sessions');
var app = express();

// session start
app.use(express.logger('dev'))
	.use(session({
	cookieName: 'session',
	secret: 'ckwtngqjqerrafourhpvi',
	duration: 30 * 60 * 1000,	// session lasts 30 minutes
	activeDuration: 15 * 60 * 1000,	// and can be restored 15 minutes at a time
	httpOnly: true,
	secure: true,
	ephemeral: true
}))
	.use(function(req, res) {
		// let's store some stuff to session
		// if no username is in session
		if (!req.session.user)
		{
			// put one in it
			req.session.user = "admin";
		}
		// put random number in session
		req.session.randomNumber = Math.random();
		res.end(JSON.stringify(req.session, null, '\t'))
	});

app.listen(8080);
