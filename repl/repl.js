/*
* Example of REPL server
*
*/

// Dependencies
const repl = require('repl');


//start the REPL
repl.start({
  'prompt': '>',
  'eval': function(str){
    //evaluate fucntion for incoming inputs
    console.log('At the evaluation stage: ', str);

    if(str.indexOf('fizz') > -1){
      console.log('buzz');
    }
    if(str.indexOf('capitan') > -1){
      console.log('whot');
    }
  }
});