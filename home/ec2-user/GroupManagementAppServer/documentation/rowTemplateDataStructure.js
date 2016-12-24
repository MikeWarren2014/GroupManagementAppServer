rowTmplData = {
	userPrivileges : 
	{ 
		view: true, // or false
		edit: true // or false
	},
	rowsData:
	[
		{
			rowID: '',
			cellsData: [
				/* something like what is shown below: */
				d
				// ... and so on, and so forth
			],
			isLoggedInUser: true // or false
		}
	]
	
}
// or 
rowTemplateData = {
	userPrivileges : 
	{ 
		view: true, // or false
		edit: true // or false
	},
	rowsData:
	[
		{
			rowID: '',
			cellsData: [
				{
					/* something like what is shown below: */
					cellName: ''
					cellData: d
				}
				// ... and so on, and so forth
			]
		}
	]
	
}
