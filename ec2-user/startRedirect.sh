# TODO: make this detect port usage by scanning any JS files in this directory for the port number (should scan for ".listen(")
# check for redirect between ports (either specified or default (80 to 8080))
#  write results of check to a variable and use it (check script: "sudo iptables -t nat -C ... "
sh checkForRedirect.sh $1 $2
if [ $? -eq 1 ] 
then 
	echo Adding rule... 
	sudo iptables -t nat -A PREROUTING -p tcp --dport "$([[ $1 ]] && echo $1 || echo 80)" -j REDIRECT --to "$([[ $2 ]] && echo $2 || echo 8080)"
	echo Rule added...
fi
