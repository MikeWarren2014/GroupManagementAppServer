$(function() {
	var template = '',
		templateData = {};
	
	// load the templateData from '/json/profile/userRoles.json'
	$.getJSON('/json/profile/userRoles.json', function(data) {
		$.extend(templateData, data.data);
		// give templateData a function that should have been passed from server side
		templateData.isTheRole = function () {
			return function(text, render) {
					return render(text) == templateData.theRole ? ' selected' : ''
			}
        }

	});
	
	// get template
	$.get('templates/elements/userRoleTemplate.html', function(d) {
		template = d;
	})
	
	$(document).ajaxStop(function() { 
		// render the template and write it to $('#firstTest')
		$('#firstTest').html($.mustache(template, templateData));
		alert('done');
		// program #testButton to make AJAX request to server
		$('#testButton').click(function() {
			$.ajax({
				method: 'get',
				url: '/serverTest',
				success: function(data)
				{
					$('b').text((parseInt($('b').text()) + 1).toString());
				},
				global: false
			})
		});
	});
});