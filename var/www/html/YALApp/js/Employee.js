// an Employee object
function Employee(first, // a string
	last, // a string
	password, // a string
	email, // a string
	phoneNumber, // a string
	hireDate, // a string
    positions, // an array of strings
	department	// a string
	)
{
	if (first instanceof UserInput) UserInput.call(this, first.first, first.last, first.password, first.email, first.phoneNumber, first.hireDate, first.department);
    else UserInput.call(this,first,last,password,email,phoneNumber,hireDate,department);
	// enforce array type
	if (Array.isArray(positions)) 
		this.positions = positions;
	
	// function that creates array of EmployeeEntry and returns it
	this.makeEntries = function()
	{
		employeeEntries = [];
		if (this.positions.length == 0) return [];
		for (var j = 0; j < this.positions.length; j++)
		{
			employeeEntries.push(new EmployeeEntry(this.first, this.last, this.password, this.email, this.phoneNumber, this.hireDate, this.positions[j], this.department));
		}
		return employeeEntries;
	}
	
	// setters (each one returns this)
	this.setPositions = function(posArray)
	{
		if (Array.isArray(posArray))
		{
			this.positions = posArray;
		}
		return this;
	}
}

Employee.prototype = Object.create(UserInput.prototype);
Employee.prototype.constructor = Employee;