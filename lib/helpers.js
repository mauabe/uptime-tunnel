/*
* Helper file
*
*/

//Dependencies
const config = require('./config');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

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
};

//Send SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback){
    //validate paramenters
  phone = typeof(phone) == 'string' && phone.trim().length == 10?  phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(phone && msg){

      //configure the request payload
      const payload = {
        "From" : config.twilio.fromPhone,
        "To" : "+1" + phone,
        "Body" : msg
      };

      //stringify payload
      const stringPayload = querystring.stringify(payload);
      //configure the request details
      const requestDetails = {
        "protocol":"https:",
        "hostname":"api.twilio.com",
        "method":"POST",
        "path":"2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
        "auth":config.twilio.accountSid +":" + config.twilio.authToken,
        "headers":{
          "Content-Type":"application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(stringPayload)
        }
      };

      // Instantiate the request object
      const req = https.request(requestDetails, function(res){
        //grab the status of request sent
        const status = res.statusCode;
        //callback successfully if the request went trough
        if(status == 200 || status == 201){
          callback(false);
        } else {
          callback('Status code returned was '+status);
        }
      });

      // bind to the erroe event so it doesnt get thrown (it owuld kook the thread)
      req.on('error', function(e){
        callback(e);
      });
      // add the payload
      req.write(stringPayload);

      //end request
      req.end();


    } else {
      callback('Given parameters were missing or invalid');
    }
} 


//Export 
module.exports = helpers;
