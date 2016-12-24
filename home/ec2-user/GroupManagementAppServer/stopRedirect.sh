# TODO: make this detect port usage by scanning any JS files in this directory for the port number (should scan for ".listen(")
# write results of check to a variable and use it (check script: "sudo iptables -t nat -C ... "
sh checkForRedirect.sh $1 $2
if [ $? -eq 0 ]; then
	echo Dropping rule that redirects traffic from port "$([[ $1 ]] && echo $1 || echo 80)" to port "$([[ $2 ]] && echo $2 || echo 8080)" ...
	sudo iptables -t nat -D PREROUTING -p tcp --dport "$([[ $1 ]] && echo $1 || echo 80)" -j REDIRECT --to "$([[ $2 ]] && echo $2 || echo 8080)"
	echo Rule dropped.
fi
