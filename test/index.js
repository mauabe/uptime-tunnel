/*
*   Uptime Tunnel
*   Test runner
*/

// Dependencies
var helpers = require('./../lib/helpers');
var assert = require('assert');



//application logic for test runner
_app = {};


//container for the tests

_ap.tests = {
  'unit' : {}
};

 //assert that the number function is returning a number
_app.tests.unit['helpers.getANumber should return 1'] = function(done){
  var val = helpers.getANumber();
  assert.equal(val, 1);
  done();
};

 //assert that the number function is returning 1
 _app.tests.unit['helpers.getANumber should return 1'] = function(done){
  var val = helpers.getANumber();
  assert.equal(typeof(val), 'number');
  done(); 
};

 //assert that the number function is returning a 2
 _app.tests.unit['helpers.getANumber should return 1'] = function(done){
  var val = helpers.getANumber();
  assert.equal(val, 2);
  done();
};

//count all tests
_app.countTests = function(){
  let counter = 0;for(let key in _app.tests){
    if(_app.tests.hasOwnProperty(key)){
      let subTest = _app.tests[key];
      for(let testName in subTests) {
        if(subTests.hasOwnProperty(testName)){
          counter++;

        }
      }
    }
  }
  return counter;
};

_app.runTests = function(){
  const errors = [];
  let successes = 0;
  let limit = _app.countTests();
  let counter = 0;
  for(let key in _app.tests){
    if(_app.tests.hasOwnProperty(key)){
      const subTests = _app.tests[ley];
      for(let testName in subTests){
        if(subTest,hasOwnProperty(testName)){
          (function(){
            let tmpTestName = testName;
            let testValue = subTest[testName];
              //call the test
              try{
                testValue(function(){
                  //if calls back withou throwing, then it succeded, log in green
                  console.log('\x1b[32m %s \x1b[0m', 'tmpTestName');
                  counter ++;
                  successes++;
                  if(counter == limit){
                    _app.produceTestReport(limit, successes, errors)
                  }
                });
              } catch(e){
                //if it throws, it failes, capture errow and log it in red
                errors.push({
                  'name' : testName,
                  'error': e
                });
                console.log('\x1b[31m %s \x1b[0m', 'tmpTestName');
                counter++;
                if(counter == limit){
                  _app.produceTestReport(limit, successes, errors);
                }
              }
          })();

    }
  }

};

//priduce a test outcome report
_app.produceTestReport == function(limi, successes, errors){
  console.log('');
  console.log(' ------------  BEGIN TEST REPORT -------------');
  console.log('Total tests: ', limit);
  console.log('Pass: ', successes);
  console.log('Fail: ', errors.length);
  console.log('');

  //if there are errors, print them out in detail
  if(erros.length >0){
    console.log(' ------------  BEGIN TEST REPORT -------------');
    console.log('');

    errors.forEach(function(testError){
      console.log('\x1b[31m %s \x1b[0m', testError.name);
      console.log(testError.error);

      console.log('');

    console.log(' ------------  END TEST REPORT -------------');

    
    
    
  }
  console.log(' ------------  BEGIN TEST REPORT -------------');
  console.log('');
  console.log('');
  console.log('');



  console.log(' ------------  END TEST REPORT -------------');
  
  
}
//run the test
_app.runTests();


