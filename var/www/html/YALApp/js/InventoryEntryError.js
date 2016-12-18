// an InventoryEntryError object
// parameter: an InventoryEntry
// TODO: write in method that fetches supremum amount from table
function InventoryEntryError(entry)
{
	this.unlistedEntry = 
	{
		item: "",
		container: "",
		location: "",
		empty: function() { return ((this.item == "") && (this.container == "") && (this.location == "")); }
	},
	this.missingFields = 
	{
		item: (entry.item == ""),
		container: (entry.container == ""),
		location: (entry.location == ""),
		test: function() { return this.item; },
		somethingMissing: function() { return ((this.item) || (this.container) || (this.location)); }
	}
	this.multiLocationContainer = false,
	this.deletedTooManyItems = false,
	this.unspecifiedAmount = false,
	this.invalidAmount = false,
	this.entry = entry;
	// functions
	// function that returns supremum for the item specified.
	this.fetchAmountSup = function()
	{
		
	}
}