// an InventoryEntry
// TODO: decide whether or not to include function for fetching supremum from #inventoryTable
function InventoryEntry(item,	// a string
	container, // a string
	amount, // an int
	loc,	// a string
	action,	// a string specifying what is to be done with this entry
	element // a string specifying the tagname of the element where this is being created
)
{
	this.item = item;
	this.container = container;
	this.location = loc;
	this.amount = amount;
	// TODO: figure out how to check that action is one of the three static variables
	this.action = action;
	this.element = element;
	
	// setters (return this)
	this.setItem = function(item)
	{
		this.item = item.toString();
		return this;
	}
	this.setContainer = function(container)
	{
		this.container = container.toString();
		return this;
	}
	this.setAmount = function(amount)
	{
		this.amount = parseInt(amount);
		return this;
	}
	this.setLocation = function(loc)
	{
		this.location = loc.toString();
		return this;
	}
	this.setAction = function(a)
	{
		if ((a === InventoryEntry.adding) || (a === InventoryEntry.deleting) || (a === InventoryEntry.recounting) || (a === InventoryEntry.logging))
			this.action = a;
		return this;
	}
	this.setElement = function(elem)
	{
		this.element = elem.toString();
		return this;
	}
}

// static strings that are used to determine what to do
InventoryEntry.deleting = "delete";
InventoryEntry.adding = "add";
InventoryEntry.recounting = "recount";
InventoryEntry.logging = "logging";	// for writing to records table