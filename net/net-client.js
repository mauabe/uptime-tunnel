/*
*   Uptime Tunnel
*   example TCP (NET) client 
*   connects to port 6000 and send the dowd 'ping' to sender
*/

// /dependencies
const net = require('net');

//define message
const outboundMessage = 'ping';


// create client
const client = net.createConnection({'port': 6000}, function(){
  //send message
  client.write(outboundMessage);
});

//parse message from server and kill client
client.on('data', function(inboundMessage){
  const messageString = inboundMessage.toString();
  console.log('I wrote ' + outboundMessage + ' and they said ' + messageString);
  client.end();
});

