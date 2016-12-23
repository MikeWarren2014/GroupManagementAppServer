function ABC(a,b)
{
	this.varA = a;
	this.varB = b;
	this.functionA = function (var1, var2)
	{
		console.log(var1 + " " + var2);
	}
}

ABC.alphabet = "English";
ABC.language = "node.js";

module.exports = ABC;
