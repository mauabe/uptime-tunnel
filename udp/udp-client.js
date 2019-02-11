/*
*   Uptime Tunnel
*   UDP client 
*/

//dependencies
const dgram = require('dgram');

//create client
const client = dgram.createSocket('udp4');


//define message and pull itinto a buffer

const messageString = 'This is a message';
const messageBuffer = Buffer.from(messageString);

// Send off the message

client.send(messageBuffer, 6000, 'localhost', function(err){
  client.close();
});