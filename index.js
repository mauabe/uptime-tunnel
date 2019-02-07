/*
*   Uptime Tunnel
*   Author, author: Mauricio Feldman-Abe
*   January 2019
*   Primary file for the API
*   Tools: NodeJS
*/

//Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');


//Declare the app
const app = {};

//Initialize server
app.init = function(callback){
  
  // Start server
  server.init();

  //Start workers
  workers.init();

  //start the CLI but make sure it starts last
  setTimeout(function(){
    cli.init();
    callback();
  }, 50);
};

//Self invoking only if required directly
if(require.main === module){
  app.init(function(){});
}
//OLD TESTING
//@TODO delete test after testing
//TEST1 
// _data.create('test', 'newFile', {'foo': 'bar'}, function(err){
//   console.log('This was the error: ', err);
// });

// TEST2
// _data.read('test', 'newFile', function(err, data){
//   console.log('this was the error: ',err, ' and this was the data: ', data);
// });

//TEST3
// _data.update('test', 'newFile', {'fizz':'poop'}, function(err){
//   console.log('this was the error: ', err);
// });

//TEST4 
// _data.delete('test', 'newFile', function(err){
//   console.log('this was the error: ', err);
// });

// TWILIO TESTING  '4158675309'
// const helpers = require('./lib/helpers');
// helpers.sendTwilioSms('4158675309', 'Hello?', function(err){
//   console.log('This was the Twilio error: ', err);
// });

//Execute the app
module.exports = app;