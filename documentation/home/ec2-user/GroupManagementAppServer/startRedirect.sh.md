# Documentation for startRedirect.sh

### Parameters

This BASH file reads in up to two parameters. 
- first parameter: source port
- second parameter: destination port
If only one parameter is specified, it is taken to be the source port.

### What This Script Does

It takes in source port and desitnation port. If source port is unspecified, it defaults to http (port 80). If destination port is undefined, it defaults to port 8080 (the port the node.js server listens on). 
It checks `iptables` for a rule that redirects source port to destination port. If there isn't one, it creates one.

### Word of caution

There is no vetting of the parameters, as there is no robust way that I knew of to vet them. Sure, you could simply enforce that ports only contain digits, but `http`, `https` are valid ports (in fact, 80, 443, respectively). 
