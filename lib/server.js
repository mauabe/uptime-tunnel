/*
*  Server related tasks
*/

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./config');
const _data = require('./data');
const helpers = require('./helpers');
const handlers = require('./handlers');

//Instantiate the server module object
const server = {};


//Instantiating http server 
server.httpServer = http.createServer(function(req, res){
  server.unifiedServer(req, res);
}); 

//Instantiate https server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
  server.unifiedServer(req, res);
});

//Instantiating http server 
server.httpsServerOptions = {
  'key' : fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  'cert' : fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};
 

//ALl the server logic for both
server.unifiedServer  = function(req, res){

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
      const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
  
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
server.router = {
  'ping' : handlers.ping,
  'users' : handlers.users,
  'tokens' : handlers.tokens,
  'checks' : handlers.checks
};

//Init script
server.init = function(){

  //Start http server
  server.httpServer.listen(config.httpPort, function(){
    console.log("The server is listening on port " + config.httpPort );
  });

  
  //Start the https server
  server.httpsServer.listen(config.httpsPort, function(){
    console.log("The server is listening on port " + config.httpsPort);
  });




}

//Export the module
module.exports = server;

