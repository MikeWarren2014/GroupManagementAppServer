// function that simply binds input validator to input element. This function gets binded to input field, especially in first tab
function bindInputValidator()
{
	var that = this;
	$(this).keyup(function() { validateTextField(that); }).change(function() { validateTextField(this); });
	// if this is a datePicker
	if ($(this).hasClass('datePicker'))	
	{
		// have this onSelect remove the 'ui-state-error' class
		$(this).datepicker('option', 'onSelect', function() { setInvalid(that,false); });
	}
}

// function that simply deletes the row containing the caller. This function gets invoked by delete button
// TODO: write version that detects if DataTables is present, and that it is being used on the table containing the caller
function deleteRow() 
{ 
	// determine if DataTables is included (let's assume the dataTables include is going to be called "jquery.dataTables.min.js")
	var dataTablesIncluded = ($('script[src*="jquery.dataTables.min.js"]').length > 0);
	// get the row,table containing the caller
	var parentRow = $(this).parents('tr'), parentTable = $(parentRow).parents('table');
	// determine if DataTables is being used on the table containing the caller
	// if it is
	if (dataTablesIncluded && parentTable.hasClass('dataTable'))	// test second argument
	{
		// delete the row containing the caller the DataTables way
		$(parentTable).DataTable().row('#' + $(parentRow).attr('id')).remove().draw(false);
	}
	// otherwise
	else
	{
		// delete the row the regular way
		$(this).parents('tr').remove(); 
		
	}
	// if parentRow is in #inventoryTable
	if ($(parentTable).attr('id') == "inventoryTable")
	{
		// form InventoryRecord from entries in parentRow
		var record = new InventoryRecord($(parentRow).find('[name="item"]').val(),
			$(parentRow).find('[name="container"]').val(),
			0,
			$(parentRow).find('[name="location"]').val(),
			new Date());
		// write that InventoryRecord to #inventoryHistoryTable
		$('#inventoryHistoryTable').append(createInventoryRecordRow(record));
	}
}

// function that adds row to #reportedItemsTable and provides notification option for end-user (so that inventory item can be retallied)
// TODO: fully implement reporting functionality, by first deciding how reporting will work
// TODO: decide whether or not this function needs any parameters
function reportInventoryRow() 
{
	var that = this;
	// fetch list of people from #employeeTable who have admin or inventory management privileges (could be database query in the future)
	var management = $.unique($("#employeeTable tr:not(#titleRow) select[name='Roles'] option:selected").filter(function() { return $(this).attr('data-inventory-manage') !== "false"; }))
		.parents('tr').map(function() { return $(this).children(':lt(2)').map(function() { return $(this).children('input').val(); }).get().join(" "); });
	// fetch item details and fill in the blanks of the dialog
	// TODO: find more scalable way of doing this.
	$('#reportedItemName').children().first().text($(this).parents('tr').find('[name="item"]').val());
	$('#reportedItemAmount').children().first().text($(this).parents('tr').find('[name="amount"]').val());
	$('#reportedItemContainer').children().first().text($(this).parents('tr').find('[name="container"]').val());
	$('#reportedItemLocation').children().first().text($(this).parents('tr').find('[name="location"]').val());
	// begin creating managementList
	var managementList = "";
	// if there is only one person in management
	if (management.length == 1)
	{
		// display <label> or <span> with that person's name
		managementList = $('<label></label>').text(management[0]);
	}
	// otherwise
	else
	{
		// if there is nobody in management
		if (management.length == 0)
		{
			// throw error state. 
			// TODO: figure out the logic here. 
		}
		// else
		else
		{
			// display <select> with all of the names
			managementList = $('<select></select>');
			$.each(management,
				function(index, value)
				{
					$(managementList).append($('<option></option>').text(value));
				});
		}
	}
	// append managementList right after the "to: "
	$('#inventoryManagement').html('').append(managementList);
	// setup dialog button to report item to inventory
	$('#reportInventoryDialog').dialog('option', 'buttons',
		$.extend(true,
			$('#reportInventoryDialog').dialog('option', 'buttons'),
			[
				{
					text: "Report Item",
					click: function()
					{
						// TODO: fetch e-mail address of person this item is being reported to and send e-mail. 
						// get copy of row this is in, and delete its last data cell
						var thisRow = $(that).parents('tr').clone(true);
						// delete last element from that reference
						$(thisRow).children().last().remove();
						// get the "selected" inventory manager from managementList
						var selectedManager;
						switch ($(managementList).prop("tagName").toUpperCase())
						{
							case "SELECT":
								selectedManager = $(managementList).children('option:selected').text();
								break;
							default:
								selectedManager = $(managementList).text();
								break;
						}
						// append cell containing that data to thisRow
						$(thisRow).append($("<td></td>").append(selectedManager));
						// scrape the text field and append cell that contains it to thisRow
						$(thisRow).append($("<td></td>").append($(this).find('textarea').val()));
						// add thisRow to #reportedItemsTable
						$("#reportedItemsTable").append(thisRow);
						// clear text area
						$(this).find('textarea').val('');
						// close this
						$(this).dialog("close"); 
					}
				}
			]
		)
	);
	$('#reportInventoryDialog').dialog('open');
}

// functions that check input validity
function isValidName(name) { return /^[A-Z][A-Za-z]+$/.test(name); }
// TODO: Use alternative to regex
function isValidEmail(email) { return /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(email); }
//function isValidPhoneNumber(phoneNumber) { return /^([0-9]{3})[0-9]{3}-[0-9]{4}$/.test(phoneNumber); }
function isValidPhoneNumber(phoneNumber) 
{ 
	return ((/^(\([0-9]{3}\)|[0-9]{3}-)\s?[0-9]{3}-[0-9]{4}$/.test(phoneNumber)) || (/^1?[0-9]{10}$/.test(phoneNumber))); 
} // naive implementation
function isValidPassword(password) { return ((password.length >= 8) && (/(?=\d+)(?=\w+)/.test(password))); }
function isValidDate(date)
{
	
	try
	{
		// parseDate using #datepicker
		return ($.datepicker.parseDate($("#datepicker").datepicker("option", "dateFormat"), date) !== false);
	}
	catch (e)
	{
		// if exception thrown simply return false
		return false;
	}
}

// function that sets/unsets hidden on an element
// parameters: string that is jQuery identifier of element to affect, boolean field that determines whether to turn it on or off
function setHidden(identifier, on)
{
	// if supposed to hide element
	if (on)
	{
		// if element does not have hidden class
		if (!$(identifier).hasClass('hidden'))
		{
			// add it
			$(identifier).addClass('hidden');
		}
	}
	// otherwise (supposed to show element)
	else
	{
		// if element has hidden class
		if ($(identifier).hasClass('hidden'))
		{
			// remove it
			$(identifier).removeClass('hidden');
		}
	}
}

// function that validates text fields
// parameter: ID of the field to validate
// returns whether or not text field contents were valid
function validateTextField(element)
{
	var validField = true;
	// Get container tag three elements up. 
	var containerTagName = $(element).parent().parent().parent().prop("tagName").toLowerCase();
	// If container is <fieldset> or <form>, identifier is supplied id. Otherwise, it is name
	var identifier = $(element).attr(((containerTagName == ("fieldset" || "form")) ? "id" : "name"));
	var text = $(element).val();
	// if field is first name or last name
	if ((identifier == "firstName") || (identifier == "lastName"))
	{
		// check field for name (first letter capitalized, the rest lowercase, and no other characters)
		validField = isValidName(text);
	}
	// if field was e-mail
	if (identifier == "email")
	{
		// do same as above, but with e-mail regex
		validField = isValidEmail(text);
	}
	// if field was employeePhoneNumber
	if ((identifier == "employeePhoneNumber") || (identifier == "phoneNumber"))
	{
		// do same as above, but with phone number regex
		validField = isValidPhoneNumber(text);
	}
	// if field was date
	if ((identifier.indexOf("date") != -1) || (identifier.indexOf("Date") != -1))
	{
		// validate the date
		validField = isValidDate(text);
	}
	// if field was password
	if (identifier == "password")
	{
		// use the password rules
		return validatePassword(element);
	}
	setInvalid(element, !validField);
	return validField;
}

// function for validating password field
// parameter: field object
function validatePassword(passwordField)
{
	// same logic as validateTextField(); // we must check what passwordField's container is
	var validField = isValidPassword($(passwordField).val());
	var containerTagName = $(passwordField).parent().parent().parent().prop("tagName").toLowerCase();
	var identifier = $(passwordField).attr(((containerTagName == ("fieldset" || "form")) ? "id" : "name"));
	var password = $(passwordField).val();
	// mark/unmark password field
	setInvalid(passwordField, !validField);
	return validField;
}

// function that marks fields invalid or removes their mark
// parameters: field object, boolean
function setInvalid(field, isInvalid, textChange, newText)
{
	// optional: predefine textChange,newText
	textChange = textChange || false;
	newText = newText || "";
	// if field is marked invalid and it should not be
	if (!isInvalid && $(field).hasClass('ui-state-error'))
	{
		// remove mark
		$(field).removeClass('ui-state-error');
		// hide notification that is right beside it, if not already done
		if (!$(field).next().hasClass('hidden'))
			$(field).next().addClass('hidden');
	}
	// otherwise, if it is not marked valid and it should be
	else if (isInvalid && !$(field).hasClass('ui-state-error'))
	{	
		// mark it
		$(field).addClass('ui-state-error');
		// if notification next to field is not visible
		// TODO: change notification text to specified text
		if ($(field).next().hasClass('hidden'))
		{
			// if notification text is supposed to change
			if (textChange)
			{
				// and if newText is provided
				if (newText !== "")
				{
					// change it
					$(field).next().text(newText);
				}
			}
			// show notification
			$(field).next().removeClass('hidden');
		}
	}
}

// function that enforces the rule that at least one checkbox is selected
// parameter: name of checkbox group
// return value: true if rule followed, false otherwise
function enforceCheckboxRule(name)
{
	var checkboxes = $('input[name="' + name + '"]');
	// count the checked checkboxes
	var count = $("input[name='" + name + "']:checked").length;
	var nextElement = $(checkboxes).last().next().next();
	// if there are no checkboxes selected, notify user that they need to select at least one checkbox. Otherwise, hide notification
	setHidden(nextElement, (count != 0));
	// return true iff there was at least one checkbox selected
	return (count > 0);
}

// function that takes user input and returns object
// return type: a JSON object containing names of any invalid/missing fields or an Employee
function fetchUserInput()
{
	var badFields = new EmployeeEntryError();
	// fetch input from text fields
	var first = $.trim($('#firstName').val()), last = $.trim($('#lastName').val()), password = $.trim($('#password').val()), email = $.trim($('#email').val()), 
		phone = $.trim($('#employeePhoneNumber').val());
	var hireDate = $.datepicker.formatDate("mm/dd/yy", $('#datepicker').datepicker('getDate'));
	var positions = [];
	var department;
	// validate it all
	if (!validateTextField($('#firstName')))
	{
		if (first == "") badFields.missing.push("First Name");
		else badFields.invalid.push("First Name");
	}
	if (!validateTextField($('#lastName')))
	{
		if (last == "") badFields.missing.push("Last Name");
		else badFields.invalid.push("Last Name");
	}
	if (!validatePassword($('#password')))
	{
		if (password == "") badFields.missing.push("Password");
		else badFields.invalid.push("Password");
	}
	if (!validateTextField($('#employeePhoneNumber')))
	{
		if (phone == "") badFields.missing.push("Phone Number");
		else badFields.invalid.push("Phone Number");
	}
	if (!validateTextField($('#email')))
	{
		if (email == "") badFields.missing.push("E-mail address");
		else badFields.invalid.push("E-mail address");
	}
	// fetch the checkbox selections
	if (!enforceCheckboxRule("positions"))	badFields.missing.push("Positions");
	else
	{
		$('input[name="positions"]:checked').each(
			function()
			{
				positions.push($(this).next().text());
			});
	}
	// fetch the radio button selection
	department = $('input[name="departments"]:checked').next().text();
	// if radio button selected text is empty (that is, if there was no selection)
	if (department == "")
	{
		// User needs to select a department
		badFields.missing.push("Departments");
	}
	
	// if badFields has any non-empty arrays
	if ((badFields.missing.length != 0) || (badFields.invalid.length != 0))
		// return badFields
		return badFields;
	// return Employee object
	return new Employee(first,
		last,
		password,
		email,
		phone,
		hireDate,
		positions,
		department);
}

// function that writes to table
// parameter: Employee
function addToEmployeeTable(employee)
{
	if (employee == null) return;
	// create EmployeeEntry array
	var employeeEntries = employee.makeEntries();
	// for each EmployeeEntry in that array
	for (var j = 0; j < employeeEntries.length; j++)
	{
		// add EmployeeEntry to employee table
		addEntryToEmployeeTable(employeeEntries[j]);
	}
}

// function that writes EmployeeEntry to table
// parameter: EmployeeEntry
function addEntryToEmployeeTable(employeeEntry)
{
	// create data cells with textfields from first name,last name,password,security number,hire date
	var baseTextField = "<input type='text'></input>", blankDataCell = "<td></td>";
	var firstNameCell = $(blankDataCell).append($(baseTextField).prop("name", "firstName").val(employeeEntry.first)),
		lastNameCell = $(blankDataCell).append($(baseTextField).prop("name", "lastName").val(employeeEntry.last)),
		hireDateCell = $(blankDataCell).append($(baseTextField).prop("name", "hireDate").addClass('datePicker').val(employeeEntry.hireDate));
	$(hireDateCell).children().first().datepicker();
	// create tel cell from phone
	var phoneNumberCell = $(blankDataCell).append($("<input type='tel'></input>").prop("name", "phoneNumber").val(employeeEntry.phoneNumber));
	// create email cell from email
	var emailCell = $(blankDataCell).append($("<input type='email'></input>").prop("name", "email").val(employeeEntry.email));
	// create <select> filled with <options> from positions,department
	var baseSelect = "<select></select>",
		rolesSelect = $(baseSelect).prop("name", "Roles"),
		departmentSelect = $(baseSelect).prop("name", "Departments");
	// create cell for role,department
	var rolesCell = $(blankDataCell).append($(rolesSelect).append(createOptionArray("Roles", employeeEntry.position))),
		departmentsCell = $(blankDataCell).append($(departmentSelect).append(createOptionArray("Departments", employeeEntry.department)));
	// create new <tr> element with id "one more than" last <tr> element
	var intLastTRID = parseInt($('#employeeTable tr:last').attr('id'));
	var newTableRow = $("<tr></tr>").attr("id", (intLastTRID + 1).toString());
	// create and render trashButton,resetPasswordButton,saveUserButton
	var blankButton = $("<button></button").addClass("ui-state-default ui-corner-all");
	var trashButton = $(blankButton).clone(true).append($("<span></span>").addClass("ui-icon ui-icon-trash"));
	var resetPasswordButton = $(blankButton).clone(true).append($("<span></span>").addClass("ui-icon ui-icon-key"));
	var saveUserButton = $(blankButton).clone(true).append($("<span></span>").addClass("ui-icon ui-icon-disk"));
	$(trashButton).button();
	$(resetPasswordButton).button();
	$(saveUserButton).button();
	// append everything to newTableRow
	newTableRow.append(firstNameCell, lastNameCell, emailCell, phoneNumberCell, hireDateCell, rolesCell, departmentsCell, 
		$(blankDataCell).append(trashButton,resetPasswordButton,saveUserButton));
	// add validator to all <input> elements in newTableRow
	$(newTableRow).find('input').each(bindInputValidator);
	// add functionality to buttons
	$(newTableRow).find('.ui-icon-trash').parents('button').click(deleteRow);
	//$(newTableRow).find('.ui-icon-key').parents('button').click();
	//$(newTableRow).find('.ui-icon-disk').parents('button').click();
	// append newTableRow to employeeTable
	$('#employeeTable').append(newTableRow);
	// re-render this page's <select>
	$("select").selectmenu();
}

// function for generating array of <option>s, based on parameter
// parameter: "Roles" or "Departments", value that is automatically selected
// return value: Array of <options>
function createOptionArray(name, defaultValue)
{
	// if first parameter is not valid, simply return
	if ((name != "Roles") && (name != "Departments")) return;
	var baseOption = "<option></option>";
	var optionArray = [];
	var	optionTextArray = [];
	// if name is "Roles"
	if (name == "Roles")
	{
		// get array of text from "positions"
		optionTextArray = $('input[name="positions"]').next().map(function() { return $(this).text(); });
	}
	// otherwise
	else
	{
		// get array of text from "departments"
		optionTextArray = $('input[name="departments"]').next().map(function() { return $(this).text(); });
	}
	// for each string in optionTextArray
	for (var j = 0; j < optionTextArray.length; j++)
	{
		// create <option> having that string as text into optionArray
		var newOption = $(baseOption).text(optionTextArray[j]);
		// setting data-inventory-manage attribute
		$(newOption).attr('data-inventory-manage', ((j >= 3) && (j < optionTextArray.length)).toString());
		// if newOption's text is defaultValue
		if (optionTextArray[j] == defaultValue)
		{
			// mark newOption as selected
			newOption.attr("selected", "selected");
		}
		optionArray.push(newOption);
	}
	return optionArray;
}

// function that generates the availability grid for availabilitySchedule
// parameters: ID of container to write availability grid to (or index), size of interval block (in minutes, as integer), (optional) start time, (optional) end time
/* modified by Michael Warren on December 30, 2016 
   parameter added: loggedInUser (string)
 */
function generateAvailabilityGrid(identifier, intervalSize, floatStartTime, floatEndTime, loggedInUser)
{
	loggedInUser = loggedInUser || 'Mike Warren';
	// for good measure, define floatStartTime,floatEndTime as 9 AM,9 PM, respectively
	floatStartTime = floatStartTime || 9;
	floatEndTime = floatEndTime || 21;
	// enforce intervalSize to be at least 10 and a divisor of 60
	if ((intervalSize < 10) || (60 % intervalSize > 0)) return;
	// enforce floatSize,floatEndTime to be between 0 and 23.99
	if (((floatStartTime < 0) || (floatStartTime >= 24)) || ((floatEndTime <= 0) || (floatEndTime >= 24))) return;
	// create container div element (will serve as availabilityTable)
	var tableDiv = $('<div class="table"></div>');
	// create hour headings 
	var hourHeadings = generateHourHeadings(floatStartTime,floatEndTime);
	// add appropriate class to them
	$(hourHeadings).children().each(
		function()
		{
			var headingClasses = ["", "", "twoColumnHeading","threeColumnHeading", "fourColumnHeading", "fiveColumnHeading", "sixColumnHeading"];
			$(this).addClass(headingClasses[60/intervalSize]);
		});
	// create table header row div and append hour headings to it
	var tableHeaderDiv = $('<div></div>').addClass('header').append(hourHeadings);
	// create dummy row div, dummy cell div
	var dummyRowDiv = $('<div class="tableRow"></div>'),
		dummyCellDiv = $('<div class="tableCell"></div>');
	// get names from #employeeTable
	var names = $('#employeeTable tr:not(#titleRow)').map(function() { return $(this).children(':lt(2)').map(
		function() 
		{ 
			var inputElements = $(this).children('input');
			return ((inputElements.length != 0) ? $(inputElements).val() : $(this).text().trim());
		}
	).get().join(" "); });  
	// for every name in names	
	$(names).each(
		function()
		{
			// copy dummy row and append label with name to it
			var row = $(dummyRowDiv).clone();
			row.append($("<label></label>").addClass('nameCell tableCell').text(this));
			for (var m = floatStartTime * 60; m < floatEndTime * 60; m += intervalSize)
			{
				// create cells
				var tempCell = $(dummyCellDiv).clone();
				// add title to cells
				var hour = Math.floor(m / 60);
				var minute = m % 60;
				var amOrPM = "AM";
				if (hour > 12)
				{
					hour -= 12;
					amOrPM = "PM";
				}
				$(tempCell).attr('title', numberToString(hour) + ':' + numberToString(minute) + amOrPM);
				if ((m % 60 == 0) && (m > floatStartTime * 60))
				{
					$(tempCell).addClass('hourMark');
				}
				// add drag listener to tempCell
				// NOTE: Default is "Mike Warren"
				//addDragListenerTo(tempCell, "Mike Warren", name);
				var clickedOrDragged = false;
				$(tempCell).mousedown(
					function()
					{
						// we have click
						clickedOrDragged = true;
						// if it is in the right row, toggle its 'available' class
						// TODO: fetch name of logged in user and replace second argument of checkCellID() with that
						if (checkCellID(this, loggedInUser, name)) $(this).toggleClass('available');
					})
				// if there was mouse leave
				.mouseleave(
					function(event)
					{
						// if clickedOrDragged
						if (clickedOrDragged)
						{
							// begin toggling highlighting of cells
							var toElement = event.toElement;
							if (($(toElement).hasClass('tableCell')) && (!$(toElement).hasClass('nameCell')) && (checkCellID(toElement, loggedInUser)))
							{
								$(toElement).toggleClass('available');
							}
							else clickedOrDragged = false;
						}
						event.preventDefault();
					})
				// on mouseup
				.mouseup(
					function()
					{
						// reset clickedOrDragged
						clickedOrDragged = false;
					});
				// TODO: fetch data and use it to "fill" appropriate cells
				// append cells to row
				$(row).append(tempCell);
			}
			// append row to container div
			$(tableDiv).append(row);
		});
	// determine if identifier is int
	var isIntIdentifier = (identifier > -1);
	// append tableDiv to div identified by identifier
	// if identifier is int
	if (isIntIdentifier)
	{
		// use index to get container to append tableDiv to and append
		$('#availabilitySchedule :nth-child(' + (identifier + 1) + ')').append(tableDiv);
	}
	else
	{
		// get container to append tableDiv to by name and append
		$(identifier).append(tableHeaderDiv, tableDiv);
		
	}
    
}
/*
// function that adds dragListener to .tableCell element
// parameters: tableCell element, target identifier of parent row (preferrably the contents of .nameCell at the beginning of the row the tableCell element is to be contained in),
//	(optional) actual id that calling function is currently on (if tableCellElem has not yet been added to any row)
function addDragListenerTo(tableCellElem, targetID, actualID)
{
	// actualID is either specified or it is the text content of the nameCell at the beginning of the tableRow that tableCellElem is in
	actualID = actualID || $(tableCellElem).parent().children('.nameCell:first').text();
	// if there was mouse down
	var clickedOrDragged = false;
	$(tableCellElem).mousedown(
		function()
		{
			// we have click
			clickedOrDragged = true;
			// if it is in the right row, toggle its 'available' class
			if (checkCellID(this, targetID, actualID)) $(this).toggleClass('available');
		})
	// if there was mouse leave
	.mouseleave(
		function(event)
		{
			// if clickedOrDragged
			if (clickedOrDragged)
			{
				// begin toggling highlighting of cells
				var toElement = event.toElement;
				if (($(toElement).hasClass('tableCell')) && (!$(toElement).hasClass('nameCell')) && (checkCellID(toElement, targetID)))
				{
					$(toElement).toggleClass('available');
				}
				else clickedOrDragged = false;
			}
			event.preventDefault();
		})
	// on mouseup
	.mouseup(
		function()
		{
			// reset clickedOrDragged
			clickedOrDragged = false;
		});
	
	clickedOrDragged = false;
}*/

// function that determines if parent of element has the name it is "supposed to"
// parameters: tableCell element, target identifier of parent row (preferrably the contents of .nameCell at the beginning of the row the tableCell element is to be contained in),
//	(optional) actual id that calling function is currently on (if tableCellElem has not yet been added to any row)
// returns: true if target id matches actual id, or false if it doesn't
function checkCellID(tableCellElem, targetID, actualID)
{
	// actualID is either specified or it is the text content of the nameCell at the beginning of the tableRow that tableCellElem is in
	actualID = actualID || $(tableCellElem).parent().children('.nameCell:first').text();
	// return true if actualID is the same as targetID and false otherwise
	return (actualID == targetID);
}

// function that generates hour div full of hour headings
// parameters: hourStart,hourEnd . Both parameters are numbers with hourEnd being asymptotic upper bound
// returns: tableRow div with hour headings
function generateHourHeadings(hourStart, hourEnd)
{
	// enforce hourStart >= 0, hourEnd < 24
	if ((hourStart < 0) || (hourEnd >= 24)) return null;
	// create dummy table row,dummy hour heading
	var tableRow = $('<div class="tableRow"></div>'),
		dummyHourHeading = $('<div class="hourHeading"></div>');
	// enforce numeric type of hourStart,hourEnd
	if ((isNaN(hourStart)) || (isNaN(hourEnd)))	return null;
	// for every integer from hourStart up to, but not including, hourEnd
	for (var h = Math.floor(hourStart); h < hourEnd; h++)
	{
		// create hourHeading
		var hourText;
		if (h < 12)
		{
			hourText = (h).toString() + " AM";
		}
		else 
		{
			hourText = ((h == 12) ? "12" : (h - 12)).toString() + " PM";
		}
		var newHourHeading = $(dummyHourHeading).clone().text(hourText);
		// append it to tableRow
		$(tableRow).append(newHourHeading);
	}
	// return tableRow
	return tableRow;
}

// helper function that generates time-formatted string of a number
// parameter: a number of at least 0
// return value: a string in the format "##"
function numberToString(n)
{
	// make sure n is number
	n = parseInt(n);
	// enforce n at least 0
	if (n < 0) return "";
	// generate string
	var str = "";
	// if n is one-digit, add '0'
	if (n < 10) str += '0';
	return (str + n);
}

// function that controls which inventory modification field is shown
// parameter: id of field to set visible (either "amountToAddRow" or "amountToRemoveRow")
// TODO: make this function scale to accomodate ANY number of fields
function showInventoryModificationField(id)
{
	// if id is neither "amountToAddRow" nor "amountToRemoveRow", simply return
	if ((id != "amountToAddRow") && (id != "amountToRemoveRow"))	return;
	// if id is "amountToAddRow", set it visible (and the inverse of that statement)
	setHidden("#amountToAddRow", (id != "amountToAddRow"));
	// if id is "amountToRemoveRow", set it visible (and the inverse of that statement)
	setHidden("#amountToRemoveRow", (id != "amountToRemoveRow"));
	// change the text in #inventoryModificationOption to "Add Item" or "Remove Item" (dependent on id)
	//$('#inventoryModificationOption').text(((id == "amountToAddRow") ? "Add Item" : "Remove Item"));
	if (id === "amountToAddRow") $('#inventoryModificationOption').text("Add Item");
	else if (id === "amountToRemoveRow") $('#inventoryModificationOption').text("Remove Item");
}


// function that returns "amount"s of rows that have values specified by "item","container","location"
// returns array of integers
function fetchItemAmounts()
{
	// find the rows that match the user's input on "item","container","location"
	var rows = findInventoryRows1();
	// return array with integer amounts
	return $(rows).map(function() { return parseInt($(this).find("[name='amount']").val()); });
}

// function that returns rows that have item,container,location that the user specified
// returns jquery object containing the matched rows
// NOTE: This function is deprecated and being replaced by function below
function findInventoryRows()
{
	// write names of table 
	// NOTE: names scales to any number of columns named anything but "amount"
	var names = $('#inventoryTable tr:not(#inventoryTableTitleRow):first td *').map(function() { var name = $(this).attr('name'); if (name != "amount") return name; });
	// NOTE: nonAmountValues scales to get value ANY field that is not the second-to-last or the last, field, and not a span or label 
	var nonAmountValues = $('#inventoryModificationOption').siblings(':not(:last)').not(':last').children(':not(span,label)').map(function() { return $.trim($(this).val()); });
	var rows = [];
	// make sure that either none of the names are empty string and they are found in the table
	for (var j = 0; j < nonAmountValues.length; j++)
	{
		// if there is at least one non-empty value that can't be found in the table by its name
		if ((nonAmountValues[j] != "") && (fetchRowsHaving(names[j], nonAmountValues[j]).length == 0))
		{
			// we are done here. Return []
			return [];
		}
	}
	// start selectively joining the rows
	for (var j = 0; j < nonAmountValues.length; j++)
	{
		// get current value
		// if value not empty string
		if (nonAmountValues[j] != "")
		{
			// fetch rows that have current value and current name
			var temp = fetchRowsHaving(names[j], nonAmountValues[j]);
			// if it is first row
			if (j == 0)
			{
				// write fetched value straight to rows
				rows = temp;
			}
			// otherwise
			else 
			{
				// if rows isn't the same collection of rows that fetched value is
				if (rows != temp)
				{
					// filter rows using fetched value
					rows = $(rows).filter(temp);
				}
			}
		}
	}
	return rows;
}

// NOTE: This function replaces the above one
function findInventoryRows1()
{
	// write names of table 
	// NOTE: names scales to any number of columns named anything but "amount"
	var names = $('#inventoryTable tr:not(#inventoryTableTitleRow):first td *').map(function() { var name = $(this).attr('name'); if (name != "amount") return name; });
	// NOTE: nonAmountValues scales to get value ANY field that is not the second-to-last or the last, field, and not a span or label 
	var nonAmountValues = $('#inventoryModificationOption').siblings(':not(:last)').not(':last').children(':not(span,label)').map(function() { return $.trim($(this).val()); });
	var rows = [];
	var isFirstMatch = true;
	// make sure that either none of the names are empty string and they are found in the table
	for (var j = 0; j < nonAmountValues.length; j++)
	{
		// if current value is neither empty nor null
		if ((nonAmountValues[j] != "") && (nonAmountValues[j] != null))
		{
			// fetch rows having current name and value
			var temp = fetchRowsHaving(names[j], nonAmountValues[j]);
			// if no rows returned, we are done
			if (temp.length == 0)	return [];
			// if this is the first match
			if (isFirstMatch)
			{
				// write fetched value straight to rows
				rows = temp;
				isFirstMatch = false;
			}
			// otherwise, if rows and fetched value point to two different sets of rows
			else if (rows != temp)
			{
				// filter rows using fetched value
				rows = $(rows).filter(temp);
			}
		}
	}
	
	return rows;
}

// helper function that returns list of rows that have element with specified name and value
// parameters: name, value (both strings). name must be one of the three names used in the inventory that is not "amount"
// return value: jQuery object containing the matched rows
function fetchRowsHaving(name,value)
{
	// get array of possible names from #inventoryTable (should NOT contain "amount")
	var arrayPossibleNames = $('table[id="inventoryTable"] tr[id!="inventoryTableTitleRow"]:first td [name!="amount"]').map(function() { return $(this).attr('name'); });
	//if name is not in that array of possible names simply return empty array
	if ($.inArray(name, arrayPossibleNames) == -1) return [];
	// if value is empty, return empty array
	if (value == "")	return [];
	// use jQuery to return array of rows that contain fields named name that have value specified
	return $('table[id="inventoryTable"] tr[id!="inventoryTableTitleRow"]').filter(function() { return $(this).find('[name="' + name + '"]').val() == value; });
}

// function for fetching Inventory input
// returns InventoryEntry on success, anonymous error object on fail
function fetchInventoryInput()
{
	var functionVersion = 1;
	// fetch entries from #itemToModify,#itemContainer,#itemLocation
	var item = $.trim($('#itemToModify').val()), container = $.trim($('#itemContainer').val()), location = $.trim($('#itemLocation').val());
	// get mode,amount
	var mode = "", formHeader = $('#inventoryModificationOption').text();
	var amount = 0;
	// if user was trying to add item
	if (formHeader ==  'Add Item') 
	{
		// mode is adding
		mode = InventoryEntry.adding;
		// fetch amount from #amountToAdd
		amount = $('#amountToAdd').spinner("value");
	}
	// if user was trying to remove item
	if (formHeader == 'Remove Item')
	{	
		// mode is deleting
		mode = InventoryEntry.deleting;
		// fetch amount from #amountToRemove
		amount = $('#amountToRemove').slider("value");
	}
	
	// create InventoryEntry object
	var entry = new InventoryEntry(item, container, amount, location, mode);
	// initialize error object
	var errorObject = new InventoryEntryError(entry);
	var validInventory = true;
	// make sure that the itemName is even one of the availableItems
	var itemsSource = ($('[name="item"]').length) ? $('[name="item"]') : $('#itemToModify');
	if ($.inArray(item, itemsSource.autocomplete("option", "source")) == -1) 
	{
		errorObject.unlistedEntry.item = item;
		validInventory = false;
	}
	// make sure that the containerName is even one of the availableContainers
	var containersSource = ($('[name="container"]').length) ? $('[name="container"]') : $('#itemContainer');
	if ($.inArray(container, containersSource.autocomplete("option", "source")) == -1)
	{
		errorObject.unlistedEntry.container = container;
		validInventory = false;
	}
	// make sure tht the locationName is even one of the avaiableLocations
	var locationsSource = ($('[name="location"]').length) ? $('[name="location"]') : $('#itemLocation');
	if ($.inArray(location, locationsSource.autocomplete("option", "source")) == -1)
	{
		errorObject.unlistedEntry.location = location;
		validInventory = false;
	}
	
	if (functionVersion < 1)
	{
		// if inventory was invalid, return errorObject
		if (!validInventory) return errorObject;
	}
	
	// if container-location rule isn't followed
	if (!enforceContainerLocationRule(container,location))
	{	
		// log that impossibility in errorObject and return it
		errorObject.multiLocationContainer = true;
		if (functionVersion < 1) return errorObject;
	}
	// if this is delete mode and user is trying to delete more of those items form that container than exist
	if ((mode == InventoryEntry.deleting) && (entry.amount > Array.min(fetchItemAmounts())))
	{
		// log that in errorObject and return it
		errorObject.deletedTooManyItems = true;
		if (functionVersion < 1) return errorObject;
	}
	// if amount was unspecified, or contains invalid characters
	if (!validateNumber(amount))
	{
		// amount is invalid
		errorObject.invalidAmount = true;
		// if amount is blank, it is unspecified
		if ((amount == "") || (amount == null)) errorObject.unspecifiedAmount = true;
		if (functionVersion < 1) return errorObject;
	}
	// if amount is 0, it is also unspecified
	if (amount == 0) errorObject.unspecifiedAmount = true;
	if (functionVersion >= 1)
	{
		// if anything was set in errorObject (other than its InventoryEntry), return errorObject
		if ((!validInventory) || (errorObject.multiLocationContainer) || (errorObject.deletedTooManyItems) || (errorObject.invalidAmount) || (errorObject.unspecifiedAmount))
			return errorObject;
	}
	// return the InventoryEntry
	return entry;
}

// function for enforcing one-location-per-container rule
// parameters: the name of the container and the name of the location, both strings
// returns: true if rule followed, false otherwise
function enforceContainerLocationRule(containerName, locationName)
{
	// fetch rows having container location
	var rowsToCheck = fetchRowsHaving("container", containerName);
	// filter rowsToCheck by rows that don't have locationName 
	var differentLocations = $(rowsToCheck).filter(function() { return $(this).find("[name=location]").val() != locationName; });
	// rule is not followed if there are rows with different locations
	return ($(differentLocations).length == 0);
}

function validateNumber(number)
{
	return /^\d+$/.test(number);
}

// function that creates <tr> element from InventoryEntry
// parameter: InventoryEntry
// return value: jQuery object that is <tr>
function createInventoryRow(entry)
{
	var baseInput = "<input></input>";
	var baseCell = "<td></td>";
	// create cell input fields
	var itemField = $(baseInput).addClass("itemAutoComplete").prop("name","item").val(entry.item),
		containerField = $(baseInput).addClass("containerAutoComplete").prop("name","container").val(entry.container),
		amountField = $(baseInput).addClass('spinner').prop("name","amount").val(entry.amount),
		locationField = $(baseInput).addClass("locationAutoComplete").prop("name","location").val(entry.location);
	// create buttons that go on the end
	var baseButton = "<button></button>";
	var deleteButton = $(baseButton).addClass("ui-state-default ui-corner-all").append($("<span></span>").addClass("ui-icon ui-icon-trash")),
		reportButton = $(baseButton).addClass("ui-state-default ui-corner-all").append($("<span></span>").addClass("ui-icon ui-icon-clipboard"));
	// render them accordingly (except for amountField, it gets rendered by function that called this one, after row this function returned gets added to #inventoryTable)
	$(itemField).autocomplete({source: $('#itemToModify').autocomplete("option", "source")});
	$(containerField).autocomplete({source: $('#itemContainer').autocomplete("option", "source")});
	//$('.spinner').spinner({ min: 1 });	// for some reason, this is not displaying spinner, and .spinner('destroy') destroys not only the "spinner", but amountField itself!
	$(locationField).autocomplete({source: $('#itemLocation').autocomplete("option", "source")});
	$(deleteButton).button();
	$(reportButton).button();
	// create data cells
	var itemCell = $(baseCell).append(itemField),
		containerCell = $(baseCell).append(containerField),
		amountCell = $(baseCell).append(amountField),
		locationCell = $(baseCell).append(locationField),
		buttonsCell = $(baseCell).append(reportButton, deleteButton);
	// get id of last row
	var lastRowID = $("#inventoryTable tr:last").attr('id');
	var firstDigitPosition = lastRowID.search(/\d/g);
	var lastRowNumber = parseInt(lastRowID.substr(firstDigitPosition));
	// create a <tr> element with incremented row ID
	var newRow = $("<tr></tr>").attr('id', (lastRowID.substr(0, firstDigitPosition) + (lastRowNumber + 1).toString()));
	// append all the cells to that newRow
	newRow.append(itemCell,containerCell,amountCell,locationCell,buttonsCell);
	// add functionality to deleteButton,reportButton
	$(newRow).children().last().children().first().click(reportInventoryRow);
	$(newRow).children().last().children().last().click(deleteRow);
	// return newRow
	return newRow;
}

// function that creates <tr> element from InventoryRecord. it fetches data from #inventoryHistoryTable, and creates <tr> for #inventoryHistoryTable .
// parameter: InventoryRecord
// return value: jQuery object that is <tr>
function createInventoryRecordRow(record)
{
	// create cells (which are to contain plaintext)
	var baseCell = "<td></td>";
	var itemCell = $(baseCell).prop("name", "recordItem").append(record.item),
		containerCell = $(baseCell).prop("name", "recordContainer").append(record.container),
		locationCell = $(baseCell).prop("name", "recordLocation").append(record.location),
		entryDateCell = $(baseCell).prop("name", "recordEntryDate").append(record.entryDate),
		amountCell = $(baseCell).prop("name", "recordAmount").addClass('textRight').append(record.amount);
	// get the number of the last record in the table
	var lastRowID = $("#inventoryHistoryTable tr:last").attr('id');
	var recordNumber = (($("#inventoryHistoryTable tr:not(:first)").length == 0) ? 0 : parseInt(lastRowID.substr(lastRowID.search(/\d/g)))) + 1;
	// return a row that contains those cells, in the following order: item, container, location, entry date, amount
	return $('<tr></tr').attr('id', ('inventoryRecord' + recordNumber)).append(itemCell, containerCell, locationCell, entryDateCell, amountCell);
}