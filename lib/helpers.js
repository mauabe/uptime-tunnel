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

//Create a string of random alphanumeric characters of a give length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' & strLength > 0 ? strLength : false;
  if(strLength){
   //Define all possible characters that could fo into a string 
   const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    //Start the final string
    let str = '';
    for(let i = 1; i <= strLength; i++){
      //Get random character from possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      //Append this character to final string
      str += randomCharacter;
    }
    //Return final string
    return str;

  }else {
    return false;
  }
}



//Export 
module.exports = helpers;
