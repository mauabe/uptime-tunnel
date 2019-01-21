/*
*  Request Handlers
*  
*/

//Dependencies
const _data= require('./data');
const helpers = require('./helpers');


//Define handlers
const handlers = {};

//Ping handler
handlers.ping = function(data, callback){
  callback(200);
};

//Define a not-found handler
handlers.notFound = function(data, callback){
  callback(404);
}

//Users
handlers.users = function(data, callback){
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) >  -1){
    handlers._users[data.method](data, callback);
  }
  else{
    callback(405);
  }
};

//container for the user submethos
handlers._users = {};

//Users - post
//Required fields: firstName, lastName, phone, password, tosAgreement
//Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgreement){
    // Make sure the user doesnt already exist
    _data.read('users', phone, function(err, data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',phone,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that phone number already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }

};


  // Users - get

  //Required data: phone
  //Optional data: none
  //Only let authenticated user to access its data
handlers._users.get = function(data, callback){
  const phone = typeof(data.queryStringObject.phone) == 'string' && dara.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    //Look up user
    _data.read('users', phone, function(err, data){
      if(!err && data){
        //Remove hashed password from user
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

//Users - put
handlers._users.put = function(data, callback){

};

//Users - delete
handlers._users.delete = function(data, callback){

};



//Export the module
module.exports = handlers;