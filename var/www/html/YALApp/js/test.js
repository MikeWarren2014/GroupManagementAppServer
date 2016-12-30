$(function() {
	
	// set up the page
	Array.min = function( array )
	{
		return Math.min.apply( Math, array );
	};
	
	
	// standard mustache.js stuff here.
	var template,
		tdata = {},
		tableTemplateFilenames = [],
		tableTemplates = [],
		tableTemplateData = [];
	
	var renderedPage, renderedTabs = [];
	
	// the body is the template
	template = $('body').html();
	// get the profile information
	var a = $.getJSON('/json/profile.json', function (d) {
		// write the profile information to tdata
		$.extend(tdata, d.data);
	});

	var tabs = [];
	/*// Test async
	async.map(data, asyncProcess, function(err, results){
        alert(results);
    });*/
	var displayName = tdata.displayName;
	// TODO: rewrite this using async
	a.complete(function()
	{
		renderedPage = $.mustache(template, tdata);
		// loading all tabs the use has access to
		var k = 0;
		(function iterator(i) {
			if (i == tdata.tabMetaData.tabs.length) return;
			if (tdata.tabMetaData.tabs[i].privileges)
			{
				var b = $.get('templates/tabs/' + tdata.tabMetaData.tabs[i].tabName + '.html',
					function(d)
					{
						console.log("Now loading file: 'templates/tabs/" + tdata.tabMetaData.tabs[i].tabName + ".html'");
						tabs.push(d);
					}
				);
				// when tab load is complete...
				b.complete(function() { 
					(function itr(j) {
						var current_tab = tdata.tabMetaData.tabs[i];
						var table_templates = current_tab.tableTemplates;
						if ((!table_templates) || (j == table_templates.length) || (k >= 2)) return;
						// if user is supposed to have view privilege on the table
						if (current_tab.privileges)
						{
							//...load data for all that table's tables
							var c = $.getJSON('/json/profile/' + table_templates[j] + '.json', 
								function(d)
								{
									// modify this
									//tableTemplateData.rowsData.push(d);
									tableTemplateData.push({
										userPrivileges: current_tab.privileges,
										rowsData: d.data
									})
								}
							);
							
							c.complete(function() 
							{
								// get templates for all that tab's tables
								var d = $.get('templates/tableRows/' + table_templates[j] + '.html', 
									function(data)
									{
										console.log("Now loading file: 'templates/tableRows/" + table_templates[j] + ".html'");
										tableTemplateFilenames.push(table_templates[j]);
										tableTemplates.push(data);
									})
								// when table template is finished loading...
								d.complete(function() {
									/*//...render that table template using the data for it you loaded
									tableTemplates[tableTemplates.length - 1] = $.mustache(tableTemplates[tableTemplates.length - 1], tableTemplateData[j])*/
									// move on to next table
									++k;
								});
							});
						}
						itr(j + 1);						
					})(0);
					iterator(i + 1); 
				});
			}
			else iterator(i + 1);
		})(0);
	});
	// when done
	$(document).ajaxStop(function() {
		var j = 0; 
		for (var k = 0; k < tableTemplates.length; k++)
		{
			// render all table templates, overwriting them in place
			tableTemplates[k] = $.mustache(tableTemplates[k], tableTemplateData[k]);
		}
		for (var i = 0; i < tabs.length; i++)
		{
			// skip over tabs the end user doesn't have access to
			while ((!tdata.tabMetaData.tabs[j].privileges) && (j < tdata.tabMetaData.tabs.length))
			{
				j++;
			}
			// render the one that the user does have access to
			if (j == tdata.tabMetaData.tabs.length)
			{
				alert("Ran out of tabs to render");
				break;
			}
			console.log("Now processing file: 'templates/tabs/" + tdata.tabMetaData.tabs[j].tabName + ".html'");
			
			var render = $.mustache(tabs[i], tdata.tabMetaData.tabs[j++]);
			// for each table in that tab
			/*var k = 0;
			$(render).find('tbody').each(function(index, element)
			{
				if (k < 2)
				{
					// rewrite that table using its template
					$(this).html(tableTemplates[k++]);
				}
			});*/
			// push it to renderedTabs (and increment index on your way out)
			renderedTabs.push(render);
		}
		// append renderedTab to renderedPage's #tabs
		var tempFakeElement = $('<div></div>');
		$(tempFakeElement).html(renderedPage).find('#tabs').append(renderedTabs);
		$('body').html($(tempFakeElement).html());
		$('table').filter(function() { return ((!$(this).attr('class')) || ($(this).attr('class').indexOf('ui') == -1)); }).find('tbody').each(function(index, element) { 
			if(index < 2)
			{
				$(this).html(tableTemplates[index]);
			}
		});
		// setup the widgets on the page
		$('body').removeClass('hidden');
		loadWidgets(displayName);
		// make logout POST to its destination
		$('#logout').click(logout);
	});
		
});

function logout(event)
{
	// prevent page refresh
	event.preventDefault();
	var that = this;
	// replace #logout with "logging out..." plaintext
	$(this).replaceWith("Logging out...");
	// make POST request to logout
	$.post(that.href, function(data)
	{
		window.location.href = data.targetURL;
	});
}

// edited on December 30, 2016 by Michael Warren
// parameter added: userDisplayName (string)
function loadWidgets(userDisplayName)
{
	$( "#accordion" ).accordion();
	
	// TODO: fill this in with server data
	var availableItems = [
		"Books",
		"Bottle Openers",
		"Brochures",
		"Cards",
		"Chalk",
		"Decals",
		"Designer Posters",
		"Flyers",
		"Pens",
		"Pins",
		"Pocketbooks",
		"Stickers"
	];
	
	// TODO: fill this in with server data
	var availableContainers = [
		"Bucket 1",
		"Bucket 2",
		"Bucket 3",
		"Bucket 4",
		"Bucket 5",
		"Gaylord 1",
		"Gaylord 2",
		"Sales box 1",
		"Sales box 2",
		"Sales box 3",
		"Sales box 4",
		"Sales box 5",
		"Sales box 6",
		"Sales box 7",
		"Sales box 8",
		"Sales box 9",
		"Sales box 10",
		"Skid 1",
		"Skid 2",
		"Skid 3",
		"Skid 4",
		"Skid 5",
		"Skid 6"
	];

	// TODO: fill this in with server data
	var availableLocations = [
		"Inbound 1",
		"Inbound 2",
		"Inbound 3",
		"Inventory",
		"Outbound 1",
		"Outbound 2",
		"Outbound 3",
		"Sales"
	];
	
	$( ".itemAutoComplete" ).autocomplete({
		source: availableItems
	});
	$(".containerAutoComplete").autocomplete({source: availableContainers});
	$(".locationAutoComplete").autocomplete({source: availableLocations});
	
	$( "button,input[type='submit']" ).button();
	$(".buttonGroup").buttonset();
	
	$( "#tabs" ).tabs();

	$( "jqueryui-dialog, .dialog" ).dialog({
		autoOpen: false,
		width: 400,
		buttons: [
			{
				text: "Ok",
				click: function() {
					$( this ).dialog( "close" );
				}
			},
			{
				text: "Cancel",
				click: function() {
					$( this ).dialog( "close" );
				}
			}
		]
	});
	
	
	$( "#datepicker" ).datepicker({ inline: true });
	$(".datePicker:not(#datePicker)").datepicker();

	$( "#amountToRemove" ).slider({
		range: "min",
		min: 0,
		max: 0,
		value: 0,
		slide: function(event, ui)
		{
			$("#selectedAmountToRemove").val(((ui.value == Infinity) ? 0 : ui.value));
		}
	});
	
	$( "#progressbar" ).progressbar({
		value: 20
	});

	$( ".spinner" ).spinner({min: 0});

	$( "#menu" ).menu();

	$( "#tooltip" ).tooltip();

	$( "select" ).selectmenu();

	// Hover states on the static widgets
	$( "#icons li" ).hover(
		function() {
			$( this ).addClass( "ui-state-hover" );
		},
		function() {
			$( this ).removeClass( "ui-state-hover" );
		}
	);
	
	// Your functions here
	$('#ClearSelections').click(
		function()
		{
			$('#datepicker').datepicker('setDate', 'today');
		});
	// TODO: decide what tables DataTables plugin should be applied to
	// use DataTables plugin on all the tables
	/*try
	{
		$('table:not(.datePicker):not(.ui-datepicker-calendar)').DataTable();
	}
	catch (e)
	{
		console.log(e);
	}*/
	// add delete function to all the trash buttons (they are the first button in the last <td> of a given <tr> that is not title row)
	$('#employeeTable tr[id!="titleRow"], #inventoryTable tr[id!="titleRow"]').map(
		function() 
		{
			return $(this).find('button').filter(function() { return $(this).find('.ui-icon-trash').length > 0; })[0];
		}).click(deleteRow);
	// add key,change listener to text fields in form,table
	$('#firstName').keyup(function() { validateTextField(this); }).change(function() { validateTextField(this); });
	$('#lastName').keyup(function() { validateTextField(this); }).change(function() { validateTextField(this); });
	$('#email').keyup(function() { validateTextField(this); }).change(function() { validateTextField(this); });
	$('#employeePhoneNumber').keyup(function() { validateTextField(this); }).change(function() { validateTextField(this); });
	$('#password').keyup(function() { validateTextField(this); }).change(function() { validateTextField(this); });
	
	$('table input').each(bindInputValidator);
	// add mouse listener to checkboxes
	$('input[name="positions"]').each(
		function() 
		{ 
			$(this).click(function() { enforceCheckboxRule('positions'); });
		});
	// add functionality to button.
	$('#addRoles').click(
		function(event)
		{
			// fetch user input
			var obj = fetchUserInput();
			// if it has missing array
			if (obj.hasOwnProperty("missing"))
			{
				// clear anything that is already in the missingDataFields,invalidDataFields
				$('#missingDataFields,#invalidDataFields').text("");
				// dump the data into, and call, dialog for invalid/missing input
				for (var j = 0; j < obj.missing.length; j++)
				{
					document.getElementById('missingDataFields').textContent += (obj.missing[j] + "\n\r");
				}
				for (var k = 0; k < obj.invalid.length; k++)
				{
					document.getElementById('invalidDataFields').textContent += (obj.invalid[k] + "\n\r");
				}
				$('#errorDialog').dialog("open");
			}
			// otherwise
			else
			{
				// dump the data into, and call, employee confirmation dialog
				$('#dialogFirstName').text(obj.first);
				$('#dialogLastName').text(obj.last);
				$('#dialogPassword').text(obj.password);
				$('#dialogEmail').text(obj.email);
				$('#dialogDateOfHire').text(obj.hireDate);
				$('#dialogPositions').text(obj.positions.join());
				$('#dialogDepartments').text(obj.department);
				
				// tie "Ok" button in dialog to addToEmployeeTable(), if not done already
				$('#hireEmployeeDialog').dialog("option", 
					"buttons",  
					$.extend(true, 
						$('#hireEmployeeDialog').dialog("option", "buttons"),
						[
							{
								text: "Add to employee table", 
								click: function() 
								{ 
									// clear selections by "click"ing "Clear Selections" button
									$("#ClearSelections").click();
									// add to employee table
									addToEmployeeTable(obj);
									// close this
									$(this).dialog("close"); 
								} 
							}
						] 
					)
				);
				$('#hireEmployeeDialog').dialog("open");
			}
			event.preventDefault();
		});
	$("#availabilitySchedule").children().each(function(j)
	{
		// setup the availability
		generateAvailabilityGrid(this, 15, 9, 21, userDisplayName);
		// find header div
		var tableHeaderDiv = $(this).find('.header');
		// move header over accordingly
		var firstNameCell = $(this).find('.nameCell:first');
		$(tableHeaderDiv).css({'left': $('.tableCell:first').width() + 2 * ( parseInt($(firstNameCell).css('padding-left')) + parseInt($(firstNameCell).css('border-left')) ) + 2 });
		// hide all availability
		setHidden(this, true);
	});
		
	// tie buttonset to set of div elements
	$("#daysOfWeek").children("input[type='radio']").each(
		function(index)
		{
			var that = this;
			$(this).click(
				function()
				{
					var len = $("#availabilitySchedule").children().length;
					$("#availabilitySchedule").children().each(function(j)
					{
						setHidden(this, (j != index));
						// if on visible index
						if (j == index)
						{
							// find header div
							var tableHeaderDiv = $(this).find('.header');
							// get first name cell 
							var firstNameCell = $(this).find('.nameCell:first');
							// if header div has not been moved over already
							var leftPadding = parseInt($(firstNameCell).css('padding-left'));
							//if (parseInt($(tableHeaderDiv).css('left')) <= 1)
							if (parseInt($(tableHeaderDiv).css('left')) <= 2 * (leftPadding + parseInt($(firstNameCell).css('border-right'))) + 1)
							{
								// move header over accordingly
								$(tableHeaderDiv).css(
									{
										'left': $(firstNameCell).width() + 2 * leftPadding + parseInt($(firstNameCell).css('border-right')) + 
											2 * parseInt($(firstNameCell).next().css('border-right'))
									}
								);
							}
						}
						
					});
				});
		}
	);
	
	// have all buttons named reportItem actually report the item
	$('[name="reportItem"]').click(reportInventoryRow);
	// show the inventory modification field for add row, by default
	showInventoryModificationField('amountToAddRow');
	// add listener to dropdown in inventory tab
	$('#inventoryModificationOptions').selectmenu({
		change: function()
		{
			// get id of selection
			var id = $($('#inventoryModificationOptions option:selected')[0]).attr('id');
			// based on id, show the appropriate inventory modification field
			showInventoryModificationField(((id == "AddItemsOption") ? 'amountToAddRow' : 'amountToRemoveRow'));
		}
	});
	// add change listeners to #itemToModify,#itemContainer,#itemLocation
	$('#itemToModify,#itemContainer,#itemLocation').each(
		function()
		{
			var that = this;
			$(this).on("autocompletechange",
				function()
				{
					// if field that triggered this function is #itemContainer
					if ($(that).attr('id') == "itemContainer")
					{
						// if #itemContainer's value is valid
						var validContainerValue = ($.inArray($.trim($(that).val()), $(that).autocomplete("option", "source")) != -1);
						if (validContainerValue)
						{
							// fetch rows that have container that match what the user inputted
							var matchingRows = fetchRowsHaving('container', $.trim($(that).val()));
							// if there were any to fetch
							if (matchingRows.length != 0)
							{
								// get the table cell containing location field
								var locationCell = $(matchingRows[0]).children().filter(function() { return $(this).children().first().prop('name') == 'location'; });
								// set the value of #itemLocation to value of location field contained in locationCell
								$('#itemLocation').val($(locationCell).children().first().val());
							}
						}
					}
					// on change, fetch amounts that correspond to the item,container,location entered as arrays of integers and set the maximum amount in the slider 
					//	to the minimum of those amounts in the intersectionArray (or 0, if intersectionArray is empty)
					var oldMax = $("#amountToRemove").slider('option', 'max');
					var min = Array.min(fetchItemAmounts());
					$('#amountToRemove').slider('option', 'max', ((min == Infinity) ? 0 : min));	
					// if new maximum has decreased
					if ($("#amountToRemove").slider("option", "max") < oldMax)
					{
						//$("#selectedAmountToRemove").val(min);
						// if the value is greater than the new maximum 
						if ($("#amountToRemove").slider("option", "max") < $("#amountToRemove").slider("option", "value"))
						{
							// update the element right next to it
							$("#selectedAmountToRemove").val($("#amountToRemove").slider("option", "max"));
							// set the value of the slider to max
							$("#amountToRemove").slider("option", "value", $("#amountToRemove").slider("option", "max"));
						}
					}
				});
		});
	
	// add key listener to #selectedAmountToRemove
	$('#selectedAmountToRemove').keypress(
		function(event) 
		{
			var x = event.keyCode;
			if ((x < 48) || (x > 57)) event.preventDefault(); 
		}).keyup(function(){ $("#amountToRemove").slider("option", "value", $("#selectedAmountToRemove").val()); });
	
	// have "Modify Inventory" modify the table
	$('#submitInventoryModification').click(
		function(event)
		{
			var obj = fetchInventoryInput();
			// if obj has unlistedEntry object
			if (obj.hasOwnProperty("unlistedEntry"))
			{
				// create baseListElement
				var baseListElement = "<li></li>",
					itemListElement = $(baseListElement).text("Item"),
					containerListElement = $(baseListElement).text("Container"),
					locationListElement = $(baseListElement).text("Location");
				// obj is error object
				// for future use, store the HTML of #invalidInventoryDialog
				var originalErrorHTML = $('#invalidInventoryDialog').html();
				// if item,container,location was either missing or invalid
				var missingEntries = obj.missingFields.somethingMissing(), unlistedEntries = !obj.unlistedEntry.empty();
				if ((unlistedEntries) || (missingEntries))
				{
					// if there were unlisted entries
					if (unlistedEntries)
					{
						// show container for unlisted entries
						setHidden('#invalidEntries', false);
						// if item entry invalid
						if (obj.unlistedEntry.item)
							// append "Item" to container for unlisted entries
							$("#invalidEntriesField").append(itemListElement);
						// if container entry invalid
						if (obj.unlistedEntry.container)
							// append "Container" to container for unlisted entries
							$("#invalidEntriesField").append(containerListElement);
						// if location entry invalid	
						if (obj.unlistedEntry.location)
							// append "Location" to container for unlisted entries
							$("#invalidEntriesField").append(locationListElement);
					}
					// if there were missing entries
					if (missingEntries)
					{
						// show container for missing entries
						setHidden('#missingEntries', false);
						// if item was missing
						if (obj.missingFields.item)
							// append "Item" to container for missing entries
							$("#missingEntriesField").append(itemListElement);
						// if container was missing
						if (obj.missingFields.container)
							// append "Container" to container for missing entries
							$("#missingEntriesField").append(containerListElement);
						// if location was missing
						if (obj.missingFields.location)
							// append "Location" to container for missing entries
							$("#missingEntriesField").append(locationListElement);
					}
				}
				// every other error should be logged to #otherIssueField
				// if container-location rule was broken 
				if (obj.multiLocationContainer)
					// notify the user that containers can only have one location
					$("#otherIssueField").append($(baseListElement).text("Container can only have one location"));
				// if user is trying to delete too many items (NOTE: this will rarely, if at all, happen, but it is here for good measure)
				if (obj.deletedTooManyItems)
				{
					// notify the user that they are deleting more items than exist, along with the number of items they are trying to delete, vs. the number of items that currently exist
					//	for that entry
					// TODO: find out way to get the amount of item pointed to by obj.entry that currently exists in the table
					$("#otherIssueField").append($(baseListElement).html("Attempt to delete too many items:\n\nNumber of items entered:<b style='color:red;'>" + obj.entry.amount + 
						"</b>\nAmount of that item that currently exists: <b>" + "</b>"));
				}
				// if amount was unspecified by the user
				if (obj.unspecifiedAmount)
				{
					// Notify the user to enter amount
					$("#otherIssueField").append($(baseListElement).text("Please enter amount"));
				}
				// if amount the user entered was invalid
				if (obj.invalidAmount)
				{
					// tell them to enter valid amount
					$("#otherIssueField").append($(baseListElement).text("The amount you entered is invalid. Please try again."));
				}
				// change close behavior so that, when error dialog closes, its content gets reset
				$('#invalidInventoryDialog').dialog({
					close: function(event,ui) { 
						$('#invalidInventoryDialog').html(originalErrorHTML);
					}
				});
				// show the error dialog
				$('#invalidInventoryDialog').dialog('open');	// 
				
			}
			// otherwise
			else
			{
				var newAmount = 0;
				// find out if row already exists in #inventoryTable with data
				var matches = findInventoryRows1();
				var deletingNonExistentRow = false;
				// if there is no match
				if (matches.length == 0)
				{
					// and we are in delete mode
					if (obj.action == InventoryEntry.deleting)
					{
						// there is problem. Show error dialog with inventory entries with the error being that you could not delete non-existent row
						deletingNonExistentRow = true;
					}
					// otherwise, if we are in adding mode
					else if (obj.action == InventoryEntry.adding)
					{
						// create row that contains InventoryEntry data and append it to InventoryTable
						var newRow = createInventoryRow(obj);
						$('#inventoryTable').append(newRow);
						$('.spinner').spinner({ min: 1 });
						// newAmount is obj.amount						
						newAmount = obj.amount;
					}
				}
				// otherwise, if there is only one row
				else if (matches.length == 1)
				{
					// get the values of the field
					var amountField = $(matches).find('[name="amount"]');
					var n = parseInt($(amountField).val());
					// if we are adding
					if (obj.action == InventoryEntry.adding)
					{
						// simply increment the amounts field by obj.amount
						newAmount = n + obj.amount;
						$(amountField).val(newAmount);
					}
					// if we are subtracting
					else if (obj.action == InventoryEntry.deleting)
					{
						// if obj.amount is equal to the amount that we are trying to remove
						if (n == obj.amount)
						{
							// just delete the row
							$(matches).remove();
							// newAmount is 0
							newAmount = 0;
						}
						// otherwise
						else
						{
							// simply subtract the amount
							newAmount = n - obj.amount;
							$(amountField).val(newAmount);
						}
					}
				}
				// if not trying to remove stuff from some non-existent row
				if (!deletingNonExistentRow)
				{
					// clear the Inventory form
					$('#ClearInventorySelections').click();
				}
				// write obj to #inventoryHistoryTable
				$('#inventoryHistoryTable').append(createInventoryRecordRow(new InventoryRecord(obj).setAmount(newAmount).setEntryDate(new Date())));
			}
			event.preventDefault();
		}
	);
	
	// have #ClearInventorySelections reset everything, including slider,spinner
	$('#ClearInventorySelections').click(
		function()
		{
			$('#amountToRemove').slider('value', 0);
			$('#amountToRemove').slider('option', 'max', 0);	
			$("#selectedAmountToRemove").val(0);
		});
		
	// CreateExternalLink should...well...create external links!
	$('#CreateExternalLink').click(
		function(event)
		{
			// get #newLinkTitle,#newLinkURL
			var linkTitle = $('#newLinkTitle').val(),
				linkURL = $('#newLinkURL').val();
			// if no linkURL
			if (!linkURL)
			{
				// alert user that they need to input a URL
				alert("Missing URL....");
				// do nothing more
				return;
			}
			// create link with specified linkURL, with linkTitle or linkURL as text
			var link = '<a href="' + linkURL + '">' + (linkTitle || linkURL) + '</a>';
			// append that link to links list
			$('#linksList').append('<li>' + link + '</li>');
			event.preventDefault();
		}
	);
}

function findTab(tabName, tabs)
{
	var target = null;
	for (var i = 0; i < tabs.length; i++)
	{
		if (tabs[i].tabName == tabName)
		{
			target = tabs[i];
			break;
		}
	}
	return target;
}