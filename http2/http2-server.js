/*
*   Uptime Tunnel
*   HTTP2 Server 
*/

 // Dependenc ies
 var http2 = require('http2');


// Instantiate the server module object
var server = http2.createServer();

//on a streem, send back response
server.on('stream', function(stream, headers){
  stream.respond({
    'status': 200,
    'content-type': 'text/html'
  })
  stream.end('<html><body><p>Hello World form http2 server.</p></body></html>');
});

//listen on 6000
server.listen(6000);
