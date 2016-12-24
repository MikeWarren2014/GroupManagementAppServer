ABOUT
=====


This is simple example of how to use session variable.

CURRENT FUNCTIONALITY
=====================

As of right now, all this does is use the developer-mode logger (express().logger('dev')), create 30-minute session that can be restored 15 minutes at a time, and log any incoming requests to the client.

SERVER-SIDE (command-line) OUTPUT
=================================

Logs, per client request, type of request, path/URL specified, and response time

CLIENT-SIDE (browser) OUTPUT
============================

Prints the whole session variable. Currently, that session contains a specified value called "user", and a random number called "randomNumber". 
