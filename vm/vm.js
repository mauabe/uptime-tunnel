/*
*   Uptime Tunnel
*   Virtual machine 
*/

 // Dependencies
const vm = require('vm');

//define a context for the environment

const context = {
  'foo': 25
};

//define scripts
const script = new vm.Script(
  `
  foo = foo * 2;
  var bar = foo +1;
  var fizz = 52;
  `
);

// run script
script.runInNewContext(context);
console.log(context);