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
const os = require('os');
const cluster = require('cluster');

//Declare the app
const app = {};

//Initialize server
app.init = function(callback){
  
  //if we are in the master thread, start background workers and CLI
  if(cluster.isMaster){

    //Start workers
    workers.init();
    
    //start the CLI but make sure it starts last
    setTimeout(function(){
      cli.init();
      callback();
    }, 50);

  //fork the process
    for(let i = 0; i < os.cpus().length; i++){
      cluster.fork();
    }

  } else {
    // if we are not in master thread Start server
    server.init();
  }
};

//Self invoking only if required directly
if(require.main === module){
  app.init(function(){});

}

//Execute the app
module.exports = app;