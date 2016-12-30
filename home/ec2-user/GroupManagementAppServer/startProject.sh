# start the port redirections
sh startRedirect.sh http 8080
sh startRedirect.sh https 8443
# start the node.js server up with forever
forever start appServer.js
