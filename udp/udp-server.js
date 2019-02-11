/*
*   Uptime Tunnel
*   UDP datagram server listening at 6000
*/

//Dependencies

const dgram = require('dgram');

//creating a server
const server = dgram.createSocket('udp4');

server.on('message', function(messageBuffer, sender){
  //do somethign with message or sender
  const messageString = messageBuffer.toString();
  console.log(messageString);

});

//bind to 600

server.bind(6000);