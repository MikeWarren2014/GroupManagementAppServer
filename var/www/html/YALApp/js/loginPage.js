$(document).ready(
	function()
	{
		if (window.location.href.match(/(fail)/) != null) {
			console.log("Time after failed password check: " + new Date().toString());
			alert("Invalid login credentials.");
			
		}
		$('#loginBtn').button();
		$('#login').click(populateLogin);
		$('#forgotUsernameLink').click(populateUsername);
		$('#forgotPasswordLink').click(populatePassword);
		$('#loginForm').submit(function(e)
		{
			// get login credentials
			//var credentials = $('#login input[type="input"],')
			var username = $('#loginUserName').val(),
				password = $('#loginPassword').val();
			var missingCredentials = false;
			if (username == '') // subject to replace by call to function in indexFunctions.js
			{
				alert("Missing username");
				missingCredentials = true;
			}
			if (password == '') // subject to replace by call to function in indexFunctions.js
			{
				alert("Missing password");
				missingCredentials = true;
			}
			if (!missingCredentials)
			{
				// POST them over to '/service/login'
				$.ajax({
					type: "POST",
					url: "/service/login",
					data: { emailAddress: username,
						password: password },
					success: function (results)
					{
						console.log(results);
						window.location = '/YALApp';
					},
					error: function(e)
					{
						var ext = window.location.href.match(/(fail)/) ? "" : "?fail";
						window.location = window.location + ext;
						console.log(JSON.stringify(e, null, '\t'));
						return false;
					}
				});
			}
			return false;
		});
	}
);

function login()
{
	// get login credentials
	//var credentials = $('#login input[type="input"],')
	var username = $('#loginUserName').val(),
		password = $('#loginPassword').val();
	var missingCredentials = false;
	if (username == '') // subject to replace by call to function in indexFunctions.js
	{
		alert("Missing username");
		missingCredentials = true;
	}
	if (password == '') // subject to replace by call to function in indexFunctions.js
	{
		alert("Missing password");
		missingCredentials = true;
	}
	if (missingCredentials) return;
	// POST them over to '/service/login'
	$.ajax({
		type: "POST",
		url: "/service/login",
		data: { emailAddress: username,
			password: password },
		success: function (results)
		{
			console.log("Time after successful password check: " + new Date().toString());
			console.log(results);
			window.location = '/YALApp';
		},
		error: function(e)
		{
			console.log("Time after failed password check: " + new Date().toString());
			console.log("authOK == " + authOK);

			var ext = window.location.href.match(/(fail)/) ? "" : "?fail";
            window.location = window.location + ext;
			console.log(JSON.stringify(e, null, '\t'));
			return false;
		}
	})
}

// function that populates login fields with prototype data
function populateLogin()
{
	// populate username field
	populateUsername();
	// populate password field
	populatePassword();
}

function populateUsername()
{
	$('#loginUserName').val("admin@mikewarren.me");
}

function populatePassword()
{
	$('#loginPassword').val('Sample0x50617373');
}