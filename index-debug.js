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

const exampleDebugginProblem = require('./lib/exampleDebuggingProblem');

/*Debugging commands in terminal to troubleshot the file: 
cont ==> continue
next ==> continue
in ==> continue
out ==> continue
pause ==> continue
repl    ----- > access the files at the debugger
CTRL + C to exit debugger

*/


//Declare the app
const app = {};

//Initialize server
app.init = function(){
    // Start server
    debugger;
  server.init();
  debugger;
  //Start workers
  workers.init();

  //start the CLI but make sure it starts last
  setTimeout(function(){
    cli.init(); 
  }, 50);

  //call init script that will throw
  exampleDebugginProblem.init();

};
debugger;
var foo = 1;
console.log('Assigned 1 to foo');
debugger;


foo++;
console.log('incremented foo');
debugger;

foo = foo * foo;
console.log('squared foo');
debugger;

foo = foo.toString();
console.log('user toString() method to turn foo into a string');
debugger;

//Execute 
app.init();
console.log('just called the library');
debugger;


//Execute the app
module.exports = app;