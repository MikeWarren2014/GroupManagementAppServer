for i in `seq 1 12`
do
	# create folder
	echo -e "Creating folder \"Chapter$i\"..."
	mkdir "Chapter$i"
	# put package.json file in each folder
	echo "inserting package.json into folder..."
	echo -e  "{\n\t\n}" > "Chapter$i/package.json"
	echo -e "folder \"Chapter$i\" done!"
done
