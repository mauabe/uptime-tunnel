/*
*  Uptime Tunnel
*  Autho, author: Mauricio Feldman-Abe
*  January 2019
*/

//Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

//The server responds to all requests with a string
const server = http.createServer(function(req, res){

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
      'payload' : buffer
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

    //Send the response
    //res.end('Hello Word \n');
  
    //Log the request path
    // console.log('Request received on path: '+ trimmedPath + ' with this ' + method + ' and these query string parameters', queryStringObject);

    // console.log('Request received with these payload: ', buffer);
  });
  //console.log('Request received with these headers: ', headers);
});

//Start server , listen on port 3000
server.listen(3000, function(){
  console.log("The server is listening on port 3000 now");
});

//Define handlers
const handlers = {};

//Sample handler
handlers.sample = function(data, callback){
    //callback a http status and payload object
    callback(406, {'name': 'sample handler'});
}

//Define a not found handler
handlers.notFound = function(data, callback){
  callback(404);

}

// Define a request router
const router = {
  'sample' : handlers.sample
};

