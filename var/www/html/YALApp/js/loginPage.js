$(document).ready(
	function()
	{
		if (window.location.href.match(/(fail)/) != null) {
			console.log("Time after failed password check: " + new Date().toString());
			alert("Invalid login credentials.");
			
		}
		$('.dialog').dialog({
			autoOpen: false,
			buttons: [
				{
					text: "Populate fields",
					click: function()
					{
						// fetch the hidden loginInfo for the option chosen
						var loginInfo = $('.dialog [type="radio"]').filter(function() { return $(this).prop('checked'); }).nextAll('input[type="hidden"]');
						// populate login form with it (assume first two input elements are username,password)
						$('#login input').filter(function(index) { return index < 2; }).each(function(index) { $(this).val($(loginInfo[index]).val() )});
						// close the dialog
						$(this).dialog("close");
						// should I just login from here?
					}
				},
				{
					text: "Cancel",
					click: function()
					{
						// just close the dialog
						$(this).dialog("close");
					}
				}
			]
		});
		$('#loginBtn').button();
		//$('#login').find(':not(input)').click(populateLogin);
		$('#login').find(':not(input):not(a)').filter(function() { return (!($(this).find('input').length) && !($(this).find('a').length)); } ).click(showSampleUserDialog);
		$('#forgotUsernameLink').click(
			function(e)
			{	
				populateUsername();
				// if this is link, prevent its default action
				if ($(this).prop('tagName').toUpperCase() == 'A')
					e.preventDefault();
			}
		);
		$('#forgotPasswordLink').click(
			function(e)
			{
				populatePassword();
				if ($(this).prop('tagName').toUpperCase() == 'A')
					e.preventDefault();
			}
		);
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
						if (!$('.progress').parent().hasClass('hidden')) $('.progress').parent().addClass('hidden');
						window.location = results.data.targetURL;
					},
					error: function(e)
					{
						var ext = window.location.href.match(/(fail)/) ? "" : "?fail";
						if (!$('.progress').parent().hasClass('hidden')) $('.progress').parent().addClass('hidden');
						console.log(JSON.stringify(e, null, '\t'));
						if (window.location.toString().substr(window.location.toString().indexOf('?')) != '?fail')
							window.location = window.location + ext;
						return false;
					}
				});
				if ($('.progress').parent().hasClass('hidden')) $('.progress').parent().removeClass('hidden');
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
	// if this is link, prevent its default action
}

// wrapper function to show dialog
function showSampleUserDialog()
{
	$('.dialog').dialog('open');
}