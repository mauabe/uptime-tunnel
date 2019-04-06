/*
*   Uptime Tunnel
*   Author, author: Mauricio Feldman-Abe
*   2019
*   Primary file for the API
*   Tools: NodeJS
*/

//Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

const app = {};

//Initialize server
app.init = callback => {
  server.init();
  workers.init();

  //start the CLI last
  setTimeout(() =>{
    cli.init();
    callback();
  }, 50);
};

//Self invoking only if required directly
if(require.main === module){
  app.init(function(){});
}

// TWILIO TESTING  '4158675309'
// const helpers = require('./lib/helpers');
// helpers.sendTwilioSms('4158675309', 'Hello?', function(err){
//   console.log('This was the Twilio error: ', err);
// });

//Execute the app
module.exports = app;