/*
*  Request Handlers
*  
*/

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

//Define handlers
const handlers = {};
 

/*
*  HTML Handlers
*  ++
*/

//Define index handlers
handlers.index = function(data, callback){
        //callback(undefined, undefined, 'html');
  //reject any request taht isnt a GET
  if(data.method == 'get'){
    //reject in a template as a string

    //prepare data for interpolation
    var templateData= {
      'head.title' : 'This is the title',
      'head.description':'This is the meta description',
      'body.title':'Hello template!',
      'body.class': 'index'
    };

    //read template as string
    helpers.getTemplate('index', templateData, function(err, str){
      if(!err && str){
        //add universal header and footer
        helpers.addUniversalTemplates(str, templateData, function(err, str){
          if(!err && str){
            //return that page as html
            callback(200, str, 'html');

          } else {
          callback(500, undefined, 'html');
          }
        });
      } else  {
        callback (500, undefined, 'html');
      }
    });
  } else{
    callback(405, undefined, 'html');
  }
};


/*
*  JSON API Handlers
*  
*/

//Ping handler
handlers.ping = function(data, callback){
  setTimeout(function(){
    callback(200);
  }, 5000);

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
  }  else{
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
  //Optional data: none   //Only allow authenticated user to access its own data
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
        callback (403, {'Error':'users get: Missing required token in header or token is invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

//Users - put   
// Required data: phone
//Optional data: fistName, lastName, password (at least one must be specified)   //Only  authenticated user update their own object.
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

      //get token
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
              _data.update('users',phone,userData,function(err){
                if(!err){
                  callback(200);
                } else {
                  callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            } else {
              callback(400,{'Error' : 'Specified user does not exist.'});
            }
          });
        } else {
          callback(403,{"Error" : "Missing required token in header, or token is invalid."});
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
// Only let authenticated user modify its owon object   // Cleanup (delete) any other data files associate with this user
handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){

    //Get token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that given token is valid for phone number
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',phone,function(err,userData){
          if(!err && userData){
            // Delete the user's data
            _data.delete('users',phone,function(err){
              if(!err){
                // Delete each of the checks associated with the user
                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;
                if(checksToDelete > 0){
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach(function(checkId){
                    // Delete the check
                    _data.delete('checks',checkId,function(err){
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        } else {
                          callback(500,{'Error' : "Errors encountered while attempting to delete all  user's checks. All checks may not have been deleted from the system."})
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."});
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
  } else {
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

//Tokens - GET **
// Req data: id
//Optional data: none
handlers._tokens.get = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

//Tokens - PUT
//Req data: id, extend
//Optional data; none
handlers._tokens.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the existing token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens',id,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token\'s expiration.'});
            }
          });
        } else {
          callback(400,{"Error" : "The token has already expired, and cannot be extended."});
        }
      } else {
        callback(400,{'Error' : 'Specified user does not exist.'});
      }
    });
  } else {
    callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
  }
};


//Tokens - DELETE
// requiered data : id
//optiona data: none
handlers._tokens.delete = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Delete the token
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
handlers._tokens.verifyToken = function(id,phone,callback){
  // Lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
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

//CHECKS
handlers.checks = function(data, callback){
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) >  -1){
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

//container for all check methods
handlers._checks = {};
 

//checks - POST **
//required data: protocol, url, method, sucessCode, timeoutSeconds
//optional data: none
handlers._checks.post = function(data, callback){
  //validate all inputs
  var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  if(protocol && url && method && successCodes && timeoutSeconds){

    // get token from header
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    //Lookup user by reading the token **
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users',userPhone,function(err,userData){
          if(!err && userData){
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify that user has less than the number of max-checks per user
            if(userChecks.length < config.maxChecks){
              // Create random id for check
              var checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              var checkObject = {
                'id' : checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method' : method,
                'successCodes' : successCodes,
                'timeoutSeconds' : timeoutSeconds
              };
              
              //save object to disk
              _data.create('checks',checkId,checkObject,function(err){
                if(!err){
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users',userPhone,userData,function(err){
                    if(!err){
                      // Return the data about the new check
                      callback(200,checkObject);
                    } else {
                      callback(500,{'Error' : 'Could not update the user with the new check.'});
                    }
                  });
                } else {
                  callback(500,{'Error' : 'Could not create the new check'});
                }
              });



            } else {
              callback(400,{'Error' : 'The user already has the maximum number of checks ('+config.maxChecks+').'})
            }


          } else {
            callback(403);
          }
        });


      } else {
        callback(403);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
  }
};


//checks - GET
//req data: id
//Optional data: none
handlers._checks.get = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the check
    _data.read('checks',id,function(err,checkData){
      if(!err && checkData){
        // Get the token that sent the request
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
          if(tokenIsValid){
            // Return check data
            callback(200,checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

//Checks - PUT
//Req data: id
//Optional Data: protocol. url, method, successCodes,timoutSeconds (one of these must be included)
handlers._checks.put = function(data, callback){
  //check required field
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  //Check for optional fields **
  var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;


  //check id validation
  if(id){
      // check make sure one or more fields has been sent
      if(protocol || url || method || successCodes || timeoutSeconds){
        //lookup check
        _data.read('checks', id, function(err, checkData){
          if(!err &&checkData){
            //get token from headers
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // verify taht given token is valid and belogs to user 
            handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
              if(tokenIsValid){
                //update the check where necessary
                if(protocol){
                  checkData.protocol = protocol;
                }
                if(url){
                  checkData.url = url;
                }
                if(method){
                  checkData.method = method;
                }
                if(successCodes){
                  checkData.successCodes = successCodes;
                }
                if(timeoutSeconds){
                  checkData.timeoutSeconds = timeoutSeconds;
                }

                //Store new updates
                _data.update('checks', id, checkData, function(err){
                  if(!err){
                    callback(200);
                  } else {
                    callback(500, {'Error':'Could not update the check'});
                  }
                })
              } else {
                callback(403);
              }
            });
          } else {
            callback(400, {'Error':'Check id did not exist.'});
          }
        });
      } else {
        callback(400, {'Error': 'Missing fields to update'});
      }
  } else {
    callback(400, {'Error':'Missing required field'});
  }
};


//Checks - DELETE
//Req Data: id
//Optional Data: none
handlers._checks.delete = function(data,callback){
  // Check that phone number is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    //lookup the check
    _data.read('checks', id, function(err, checkData){
      if(!err && checkData){
        //Get token from headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that given token is valid for phone number
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
          if(tokenIsValid){

            // Delete check data
            _data.delete('users', id, function(err){
              if(!err){
                //lookup users object to get all checks
                _data.read('users', checkData.userPhone, function(err, userData){
                  if(!err){
                    const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                    //Remove deleted check from the list of checks
                    const checkPosition = userChecks.indexOf(id);
                    if(checkPosition > -1){
                      userChecks.splice(checkPosition, 1)
                      //Re-save user's data
                      userData.checks = userChecks;
                      _data.update('users'. checkData.userPhone, userData, function(err){
                        if(!err){
                          callback(200);
                        } else {
                          callback(500, {'Error':'Could not update the user.'});
                        }
                      });
                    } else {
                      callback(500, {'Error':'Could not find the check on user\'s object, so could not remove it.'});
                    }
                  } else {
                    callback(500,{'Error' : 'Could not find the user who created the check, so could not remove the check from the list of checks on their user object.'});
                  }
                });
              } else {
                callback(500, {'Error':'Could not delete the check data.'});
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400,{'Error' : 'The check ID specified could not be found.'});
      }
    });
  } else {
    callback(400, {'Error':'Missing valid id.'});
  }
};

//Export the module 
module.exports = handlers; 