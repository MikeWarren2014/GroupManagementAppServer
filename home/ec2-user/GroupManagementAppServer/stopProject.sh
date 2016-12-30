# stop the port redirections
sh stopRedirect.sh http 8080
sh stopRedirect.sh https 8443
# stop the node.js server up with forever
forever stop appServer.js

