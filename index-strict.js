/*
*   Uptime Tunnel
*   Author, author: Mauricio Feldman-Abe
*   January 2019
*   Primary file for the API
*   Tools: NodeJS
*/

// start with node --use_strict index-strict.js



//Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');


//Declare the app
const app = {};

//ceclare a global( that strict mode should catch)
// var foo = 'bar';

foo = 'bar';  //without 'var' js creates a global variable


//Initialize server
app.init = function(){
    // Start server
  server.init();
  //Start workers
  workers.init();

  //start the CLI but make sure it starts last
  setTimeout(function(){
    cli.init();
  }, 50);
};

//Execute 
app.init();


//Execute the app
module.exports = app;