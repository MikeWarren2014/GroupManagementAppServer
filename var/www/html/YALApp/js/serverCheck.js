$(function()
{
	// make GET request to server
	$.ajax({
		type: "GET",
		url: '/serverTest',
		success: function(results)
		{
			
			if (results.status == 'ok')
			{
				// continue as normal
			}
			else
			{
				// redirect to 404 page
				window.location = '404.html';
				return false;
			}
			console.log(JSON.stringify(results, null, '\t'));
		},
		error: function(e)
		{
			// redirect to 404 page
			window.location = '404.html';
			return false;
		}
	})
});