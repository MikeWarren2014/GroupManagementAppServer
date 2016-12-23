$(function()
	{
		var tmpl,	// main template HTML
			tdata = {}; // JSON data object that feeds template
			
		// Initialize page
		var initializePage = function() {
			// get album name (from this URL)
			var parts = window.location.href.split("/");
			var albumName = parts[5]; // really not liking these static indices
			
			// load HTML template
			$.get("/templates/album.html",
				function(d){
					tmpl = d;
				}
			);
			
			// retrieve server data and then initialize page
			$.getJSON("/albums/" + albumName + ".json", function(d)
			{
				var photo = massageAlbum(d);
				$.extend(tdata, photo);
			});
			
			// when AJAX calls complete, parse template
			$(document).ajaxStop(function()
			{
				var renderedPage = $.mustache(tmpl, tdata);
				$('body').html(renderedPage);
			});
		}();
	}
);

function massageAlbum(d)
{
	if (d.error) return d;
	var obj = { photos: []};
	
	var af = d.data.albumData;
	
	for (var i = 0; i < af.photos.length; i++)
	{
		var url = "/albums" + af.shortName + "/" + af.photos[i].filename;
		obj.photos.push({ url: url, desc: af.photos[i].filename });
	}
	return obj;
}