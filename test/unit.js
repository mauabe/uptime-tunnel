/*
*   Uptime Tunnel
*   Unit test
*/

// Dependencies
const helpers = require('./../lib/helpers.js');
const logs = require('./../lib/logs.js');
const exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem.js');
const assert = require('assert');

// Holder for Tests
const unit = {};


 // assert that the getANumber function is returning a number
 unit['helpers.getANumber should return a number'] = function(done){
  let val = helpers.getANumber();
  assert.equal(typeof(val), 'number');
  done();
};

// Assert that the getANumber function is returning 1
unit['helpers.getANumber should return 1'] = function(done){
  let val = helpers.getANumber();
  assert.equal(val, 1);
  done();
};

// Assert that the getANumber function is returning 2   //LOGS AN ERROR
unit['helpers.getNumberOne should return 2'] = function(done){
  let val = helpers.getANumber();
  assert.equal(val, 2);
  done();
};

// /* Logs.list should callback an array and a false error   // TROUBLE WITH LOGS
unit['logs.list should callback a false error and an array of log names'] = function(done){
  logs.list(true, function(err, logFileNames){
      assert.equal(err, false);
      assert.ok(logFileNames instanceof Array);
      assert.ok(logFileNames.length > 1);
      done();
  });
}; // */

//logs =.truncate should not throw if it doesn't exist
unit['logs.truncate should not throw if the logId does not exist, should callback an error instead'] = function(done){
  assert.doesNotThrow(function(){
    logs.truncate('I do not exist', function(err){
      assert.ok(err);
      done();
    })
  }, TypeError);
};

// exampleDebuggingProblem.init should not throw (but it does)  // LOGS AN ERROR
unit['exampleDebuggingProblem.init should not throw when called'] = function(done){
  assert.doesNotThrow(function(){
    exampleDebuggingProblem.init();
    done();
  }, TypeError);
};  
// 

// Export the tests to the runner
module.exports = unit;
