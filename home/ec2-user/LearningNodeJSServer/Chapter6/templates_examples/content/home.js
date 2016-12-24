$(function() {
	var tmpl,	// main template HTML
		tdata = {}; // JSON data object that feeds template
			
	// initialize page
	var initializePage = function() {
		// Load HTML template
		$.get("/templates/home.html", function(d) {
			tmpl = d;
		});
		
		// retrieve server data and then initialize page
		$.getJSON("/albums.json", function(d) {
			$.extend(tdata, d.data);
		});
		
		// when AJAX calls complete, parse the template, replacing mustache tags with vars
		$(document).ajaxStop(function() {
			var renderedPage = $.mustache(tmpl, tdata);
			$('body').html(renderedPage);
		});
	}();
});