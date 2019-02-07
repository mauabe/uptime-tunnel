/*
*  Library to test error throwing when iint() is called
*
*/

//container
var example = {};

// Init function
example.init = function(){
  // This is an error created intentionally (bar is not defined)
  var foo = bar;
};

// Export the module
module.exports = example;
