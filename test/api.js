/*
*   Uptime Tunnel
*   API test
*/

// Dependencies
const app = require('./../index');
const assert = require('assert');
const http = require('http');
const config = require('./../lib/config');

const api = {};

const helpers = {};
helpers.makeGetRequest = function(path,callback){
  const requestDetails = {
    'protocol' : 'http:',
    'hostname' : 'localhost',
    'port' : config.httpPort,
    'method' : 'GET',
    'path' : path,
    'headers' : {
      'Content-Type' : 'application/json'
    }
  };

  const req = http.request(requestDetails,function(res){
      callback(res);
  });
  req.end();
};

// stop main init() function from throwing.
api['app.init should start without throwing'] = function(done){
  assert.doesNotThrow(function(){
    app.init(function(err){
      done();
    })
  },TypeError);
};

// request to /ping
api['/ping should respond to GET with 200'] = function(done){
  helpers.makeGetRequest('/ping',function(res){
    assert.equal(res.statusCode,200);
    done();
  });
};

// Make a request to /api/users
api['/api/users should respond to GET with 400'] = function(done){
  helpers.makeGetRequest('/api/users',function(res){
    assert.equal(res.statusCode,400);
    done();
  });
};

// Make a request to a random path
api['A random path should respond to GET with 404'] = function(done){
  helpers.makeGetRequest('/this/path/shouldnt/exist', function(res){
    assert.equal(res.statusCode,404);
    done();
  });
};

// Export the tests to the runner
module.exports = api;
