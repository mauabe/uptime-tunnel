/*
*   Uptime Tunnel
*   example TLS client 
*   connects to port 6000 and send the dowd 'ping' to server
*/

// /dependencies
const tls = require('tls');
const fs = require('fs');
const path = require('path');

//define message
const outboundMessage = 'ping';

//server options
const options = {
'ca': [fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))] 
//only required because we are using a self-signed certificate
};

// create client
const client = tls.connect(6000, options, function(){
  //send message
  client.write(outboundMessage);
});

//parse message from server and kill client
client.on('data', function(inboundMessage){
  const messageString = inboundMessage.toString();
  console.log('I wrote ' + outboundMessage + ' and they said ' + messageString);
  client.end();
});

