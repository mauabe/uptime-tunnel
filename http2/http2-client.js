/*
*   Uptime Tunnel
*   HTTP2 client 
*/

 // Dependencies
 var http2 = require('http2');


 //create client
 const client = http2.connect('http://localhost:6000');

 //create a request
 const req = client.request({
  ':path' : '/'
 });

 //when a message is received, add the pieces together until you reach the end
let str = '';
req.on('data', function(chunk){
  str += chunk;
});

// when message ends, log it out
req.on('end', function(){
  console.log(str)
});

// end request
req.end();