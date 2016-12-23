function computeIntersection(firstArray, secondArray, callback)
{
	// categorize arrays with respect to size
	var bigger = ((firstArray.length > secondArray.length) ? firstArray : secondArray);
	var smaller = ((bigger == firstArray) ? secondArray : firstArray);
	
	var startIndex = 0,
		size = 10,
		results = [];
		
	// for each chunk of size elements in bigger, search through smaller
	function computeIntersectionHelper()
	{
		console.log("startIndex == " + startIndex);
		for (var i = startIndex; ((i < startIndex + size) && i < bigger.length); i++)
		{
			for (var j = 0; j < smaller.length; j++)
			{
				// if current element of bigger is the same as that of smaller
				if (bigger[i] == smaller[j])
				{
					// append it to results
					results.push(smaller[j]);
					// our search within the smaller array for matching element is over
					break;	
				}
			}
		}
		
		// if we just processed the last element of bigger
		if (i >= bigger.length)
		{
			// send results back. We're done here
			callback(null, results);
		}
		// otherwise, we have more work to do. 
		else
		{
			// tail-recurse on next block of bigger
			startIndex += size;
			process.nextTick(computeIntersectionHelper);
		}
	}
	
	// start the engines!
	computeIntersectionHelper();
}

var a1 = [ 1433, 188, 3534, 186, 1336, 3345, 1862, 1878, 2076, 3460, 1313, 1091, 793, 3507, 215, 2246, 3061, 1396, 3347, 1495],
	a2 = [ 3185, 1988, 2048, 3341, 3825, 1077, 274, 3419, 2609, 1303];

computeIntersection(a1, a2, function(err, results)
{
	if (err)
	{
		console.log(err);
	}
	else
	{
		console.log(results);
	}
});