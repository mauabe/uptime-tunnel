/*
*  Uptime Tunnel
*  Autho, author: Mauricio Feldman-Abe
*  January 2019
*/

//Dependencies
const http = require('http');
const url = require('url');

//The server responds to all requests with a string
const server = http.createServer(function(req, res){

  //Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  //Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //Send the response
  res.end('Hello Word \n');

  //Log the request path
  console.log('Request received on path: '+ trimmedPath);

});

//Start server , listen on port 3000
server.listen(3000, function(){
  console.log("The server is listening on port 3000 now");
});

