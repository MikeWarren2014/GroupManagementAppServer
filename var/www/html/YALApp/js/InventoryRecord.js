// an InventoryRecord
function InventoryRecord(item, // a string
	container,	// a string
	amount,	// an int
	loc,	// a string
	entryDate,	// a date/time object
	element	// string specifying tag name where this is being created
)
{
	if (item instanceof InventoryEntry)	InventoryEntry.call(this, item.item, item.container, item.amount, item.location, InventoryEntry.logging, item.element);
	else InventoryEntry.call(this, item, container, amount, loc, InventoryEntry.logging, element);
	this.entryDate = entryDate;
	
	// setters (return this)
	this.setEntryDate = function(date)
	{
		// enforce Date/String type
		if ((date instanceof Date ) || (date instanceof String))
		{
			this.entryDate = date;
		}
		return this;
	}
}

InventoryRecord.prototype = Object.create(InventoryEntry.prototype);
InventoryRecord.prototype.constructor = InventoryRecord;