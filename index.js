/*
*  Uptime Tunnel
*  Author, author: Mauricio Feldman-Abe
*  January 2019
*/

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const _data = require('./lib/data');
const helpers = require('./lib/helpers');
const handlers = require('./lib/handlers');

//TESTING
//@TODO delete test after testing
//TEST1 
// _data.create('test', 'newFile', {'foo': 'bar'}, function(err){
//   console.log('This was the error: ', err);
// });

// TEST2
// _data.read('test', 'newFile', function(err, data){
//   console.log('this was the error: ',err, ' and this was the data: ', data);
// });

//TEST3
// _data.update('test', 'newFile', {'fizz':'poop'}, function(err){
//   console.log('this was the error: ', err);
// });

//TEST4 
// _data.delete('test', 'newFile', function(err){
//   console.log('this was the error: ', err);
// });

//Instantiating http server 
const httpServer = http.createServer(function(req, res){
  unifiedServer(req, res);
}); 

//Start http server
httpServer.listen(config.httpPort, function(){
  console.log("The server is listening on port " + config.httpPort );
});


//Instantiate https server
const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
  };

const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

//Start https server
httpsServer.listen(config.httpsPort, function(){
  console.log("The server is listening on port " + config.httpsPort);
});


//ALl the server logic for both
const unifiedServer = function(req, res){

    //Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    //Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
    // Get the query string as an object
    const queryStringObject = parsedUrl.query; 
  
    // Get the HTTP method  // get, post, head(?)
    const method = req.method.toLowerCase();
  
    // Get headers as an object
    const headers = req.headers;
  
    //Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function(data){
      buffer += decoder.write(data);
    });
    req.on('end', function(){
      buffer += decoder.end();
  
      //Choose handler this req shoudl go to
      //If not found got o notFOund handler
      const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
  
      // Construct data object to sen to handler
      const data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
      };
  
      // Route the request to the hander specified in the router
      chosenHandler(data, function(statusCode, payload){
  
        //Use status code called by the handler, or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
  
        //Use payload called by hendler or default to enmptyobject
        payload = typeof(payload) == 'object' ? payload : {};
  
        //Convert paload to string
        const payloadString = JSON.stringify(payload);
  
        //Return response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log('Return this response: ', statusCode, payloadString ); 
      })
    });
  
};


// Define a request router
const router = {
  'ping' : handlers.ping,
  'users' : handlers.users
};

