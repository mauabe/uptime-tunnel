/*
*   Uptime Tunnel
*   example of TCP (NET) server 
*   Listen to port 6000 and sends the word 'pong' to client  
*/

//dependencies
const net = require('net');

//create the server
const server = net.createServer(function(connection){
  //send the word 'pong'
  const outboundMessage = 'pong';
  connection.write(outboundMessage);

  //when the client writes something, log it out
  connection.on('data', function(inboundMessage){
    const messageString = inboundMessage.toString();
    console.log('I wrote ' + outboundMessage + ' and they said ' + messageString);
  });
});

server.listen(6000);