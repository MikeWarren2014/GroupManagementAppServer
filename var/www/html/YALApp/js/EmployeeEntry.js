// an EmployeeEntry object
function EmployeeEntry(first, // a string
	last, // a string
	password, // a string
	email, // a string
	phoneNumber, // a string
	hireDate, // a string
    position, // a string
	department	// a string
	)
{
    UserInput.call(this,first,last,password,email,phoneNumber,hireDate,department);
    this.position = position;
}