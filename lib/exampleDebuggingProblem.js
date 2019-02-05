/*
*  Library to test error throwing when iint() is called
*
*/

//container
var example = {};

example.init = function(){
  //error intentionally created (bar is not defined)
  var foo = bar;
};

module.exports = example;
