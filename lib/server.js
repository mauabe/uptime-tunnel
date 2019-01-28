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
const helpers = require('./helpers');
const handlers = require('./handlers');
const util = require('util');
const debug = util.debuglog('server');


//Instantiate the server module object
const server = {};

 // Instantiate the HTTP server
 server.httpServer = http.createServer(function(req, res){
  server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
  server.unifiedServer(req,res);
});

//ALl the server logic for both
server.unifiedServer  = function(req, res){

    //Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    //Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
    // Get the query string as an object
    const queryStringObject = parsedUrl.query; 
  
    // Get the HTTP method  // get, post, put, delete
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
  

      //Choose handler this req shoudl go to. If not found got o notFOund handler
      const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

      //if req is within public directory, use public handler
      choneHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
  
      // Construct data object to sen to handler
      const data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
      };
  
  
      // Route the request to the hander specified in the router
      chosenHandler(data, function(statusCode, payload, contentType){
  
        // detemine the tyepe of response (default to JSON)
        contentType = typeof(contentType) == 'string' ? contentType : 'json'; 

        //Use status code called by the handler, or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
  
        //Return response parts that are content specific
        let payloadString = '';
          if(contentType == 'json'){
            res.setHeader('Content-Type', 'application/json');
            payload = typeof(payload) == 'object' ? payload : {};
            payloadString = JSON.stringify(payload);
          }
          if(contentType == 'html'){
            res.setHeader('Content-Type', 'text/html');
            payloadString = typeof(payload) == 'string' ? payload : '';
          }
          if(contentType == 'html'){
            res.setHeader('Content-Type', 'text/css');
            payloadString = typeof(payload) == 'string' ? payload : '';
          }

          if(contentType == 'favicon'){
            res.setHeader('Content-Type', 'image/x-icon');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }
          if(contentType == 'png'){
            res.setHeader( 'Content-Type', 'image/png');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }
          if(contentType == 'jpg'){
            res.setHeader('Content-Type', 'image/jpg');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }          
          if(contentType == 'pain'){
            res.setHeader('Content-Type', 'text/plain');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }


        // return the response parts that are common to all content types
        res.writeHead(statusCode);
        res.end(payloadString);

        //if the response is 200, print green , otherwise red
        if(statusCode == 200){
          debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
        } else {
          debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
        }
      });

    });
  };

// Define a request router
server.router = {
  '': handlers.index,
  'account/create' : handlers.accountCreate,
  'account/edit' : handlers.accountEdit,
  'account/deleted' : handlers.accountDeleted,
  'session/create' : handlers.sessionDeleted,
  'session/deleted': handlers.sessionDeleted,
  'checks/all' : handlers.checksList,
  'checks/create' : handlers.checksCreate,
  'checks/edit' : handlers.checkEdit,
  'ping' : handlers.ping,
  'api/users' : handlers.users,
  'api/tokens' : handlers.tokens,
  'api/checks' : handlers.checks,
  'favicon.ico' : handlers.favicon,
  'public': handlers.public
};

//Init script
server.init = function(){
  //Start http server  *** NODE_DEBUG=workers node index.js
  server.httpServer.listen(config.httpPort, function(){
     console.log('\x1b[36m %s \x1b[0m', 'The server is listening on port ' + config.httpPort );
  });

  //Start the https server
  server.httpsServer.listen(config.httpsPort, function(){
    console.log('\x1b[35m %s \x1b[0m', "The server is listening on port " + config.httpsPort);
  });
};


//Export the module
module.exports = server;
