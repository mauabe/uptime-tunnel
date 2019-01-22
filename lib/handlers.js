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
          _data.create('users', phone, userObject, function(err){
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
  //Only allow authenticated user to access its own data
handlers._users.get = function(data, callback){
  //Check if phone is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    //get token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // /verify taht given token is valid for phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if(tokenIsValid){
        //Lookup user
        _data.read('users', phone, function(err, data){  
          if(!err && data){
            //Remove hashed password from user object
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback (403, {'Error':'Missing required token in header or token is invalid'});
      }
    });

  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

//Users - put
// Required data: phone
//Optional data: fistName, lastName, password (at least one must be specified)
//@TODO Onl let authenticated user update thei own object.
handlers._users.put = function(data, callback){
  // Check for required field
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  //Check for optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
 
  // Error if phone is invalid
  if(phone){
    // Error if nothing is sent to update
    if(firstName || lastName || password){
      const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that given tiken is valid for phone number
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users', phone, function(err, userData){
            if(!err && userData){
              // Update the fields if necessary
              if(firstName){
                userData.firstName = firstName;
              }
              if(lastName){
                userData.lastName = lastName; 
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users', phone, userData, function(err){
                if(!err){
                  callback(200);
                } else {
                  console.log(err);
                  callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            } else {
              callback(400,{'Error' : 'Specified user does not exist.'});
            }
          });
        } else {
          callback(403,{'Error':'Missing required token in header or token is invalid'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }

};

//Users - delete
//Required fied: phone
// Only let authenticated user modify its owon object
// Cleanup (delete) any other data files associate with this user

handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){


    // Verify that given tiken is valid for phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',phone,function(err,data){
          if(!err && data){
            _data.delete('users',phone,function(err){
              if(!err){
                callback(200);
              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });
      } else {
        callback(403,{'Error':'Missing required token in header or token is invalid'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};



//Tokens
handlers.tokens = function(data, callback){
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) >  -1){
    handlers._tokens[data.method](data, callback);
  }
  else{
    callback(405);
  }
};

// Container for all token methods
handlers._tokens = {};

//Tokens - POST
//Require data: phone, password
//Require data: none
handlers._tokens.post = function(data, callback){
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(phone && password){
    //Lookup the user who matches the phone number
    _data.read('users', phone, function(err, userData){
        if(!err && userData){
          //Hash the send password, and compare with password in userObject
          const hashedPassword = helpers.hash(password);
          if(hashedPassword == userData.hashedPassword){
            // If valid, create a new token with  a rondom name. Set expiration data 1 hour in the future
            const tokenId = helpers.createRandomString(20);
            const expires = Date.now() + 1000 * 60 * 60;
            const tokenObject = { 
              'phone' : phone,
              'id' : tokenId,
              'expires' : expires
            };

            //Store token
            _data.create ('tokens', tokenId, tokenObject, function(err){
                if(!err){
                  callback(200, tokenObject);
                } else {
                  callback(500, {'Error':'Could not create the new token.'})
                }
            });
        } else {
          callback(400, {'Error':'Password did not match specified user\'s stored password'});
        };
      } else {
        callback(400, {'Error': 'Could not find specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field(s)'});
  }

};

//Tokens - GET
// Req data: id
//Optional data: none
handlers._tokens.get = function(data, callback){
  //Check if phone is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    //Look up token
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

//Tokens - PUT
//Req data: id, extend
//Optional data; none

handlers._tokens.put = function(data,callback){
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the existing token
    _data.read('tokens', id, function(err, tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens', id, tokenData, function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token\'s expiration.'});
            }
          });
        } else {
          callback(400,{'Error' : 'The token has already expired, and cannot be extended.'});
        }
      } else {
        callback(400,{'Error' : 'Specified user does not exist.'});
      }
    });
  } else {
    callback(400,{'Error': 'Missing required field(s) or fields are invalid.'});
  }
};


//Tokens - DELETE
// requiered data : id
//optiona data: none

handlers._tokens.delete = function(data, callback){
  // Check that id number is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the user
    _data.read('tokens',id,function(err,data){
      if(!err && data){
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


//Verify if given token id is currently valid for given user
handlers._tokens.verifyToken = function(id, phone, callback){
    //look up token
  _data.read('tokens', id, function(err, tokenData){
    if(!err && tokenData){
      // Check if token is not expired
      if(tokenData.phone == phone && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


//Export the module
module.exports = handlers;