var tabs = [];
var k = 0;

async.series([
	function(callback)
	{
		$.getJSON('/json/profile.json', function(d)
		{
			$.extend(tdata, d.data);
			callback(null);
		})
	},
	function(callback)
	{
		renderedPage = $.mustache(template, tdata);
		callback(null, true);	// mock
	}

	],
	function(err, results)
	{
		
	});