# if either no arguments specified or all arguments specified are numbers
if [[ $# -le 2 ]]
then 
	# TODO: get port number from any JS files (search for ".listen(" in such files)
	# search iptables for port redirection rule from ports specified, or port 80, to port specified, or port 8080
	sudo iptables -t nat -C PREROUTING -p tcp --dport "$([[ $1 ]] && echo $1 || echo 80)" -j REDIRECT --to "$([[ $2 ]] && echo $2 || echo 8080)"

fi
