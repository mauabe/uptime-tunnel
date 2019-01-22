/*
* Helper file
*
*/

//Dependencies
const crypto = require('crypto');
const config = require('./config');

//cointainer for all helpers
const helpers = {};

//Create function Parse JSON string to object, whitout throwing
helpers.parseJsonToObject = function(str){
  try{
      const obj = JSON.parse(str);
      return obj;
  } catch(e){
    return {};
  }
};

// create a sha256 hash (built into node, does not require external library)
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    return hash;
  } else {
    return false;
  }
}


//Export 
module.exports = helpers;
