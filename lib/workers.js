/*
*   Worker-related tasks
*
*/

//Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const http = require('http');
const https = require('https');
const helpers = require('./helpers');
const url = require('url');

// Instatiate Worker Object
const workers = {};

//lookup all checks, get data ans send a validator
workers.gatherAllChecks = function(){
  //get all checks
  _data.list('checs', function(err, checks){
    if(!err && checks && checks.length > 0){
      checks.forEach(function(check){
        //read in the check data
        _data.read('checks', check, function(err, originalCheckData){
          if(!err && originalCheckData){
            //Pass it to the validator, and let that function continue
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the check\'s data.');
          }
        });
      });
    } else {
      console.log('Error: could not find any checks to process');
    }
  });


};

//Sanity-check the check-data
workers.validateCheckData = function(originalCheckData){
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'number' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ?originalCheckData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds %1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

  //Set the keys that may not be set (if workers have never seen this check before)
  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // if all checks pass, pass the data along the next step
  if(originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds){
      workers.performCheck(originalCheckData);
    } else {
      console.log('Errror: One of the checks is not properly formatter. Skipping it.');
    }
};

//perform the check, send the originalCheckData and the outcome to the check process to next step
workers.performCheck = function(originalCheckData){
  
  //prepare the initial check outcome
  const checkOutcome = {
    'error' : false,
    'responseCode': false
  };

  // Mark that the outcome has not been sent yet
  const outcomeSent = false;

  //Parse the hostname and the path of the original check data
  const pasedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  const hostName = paredUrl.hostname;
  const path = parsedUrl.path; //Using path and not 'pathname' because we want the query string //var??????? xxx

  //construct the request
  const requestDetails = {
    'protocol': originalCheckData.protocol + ':',
    'hostname' : hostname,
    'method' : originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout' : originalCheckData.timeoutSeconds * 1000
  };

  //Instantiate the request object (using either the http or https module)
  const _moduleToUse = originalCheckData.protocol == 'http'? http: https;
  const req = _moduleToUse.request(requestDetails, function(res){
    //grab the status code of the request
    const status = res.statusCode;

    // Update the checkOutome and pass data along
    checkOutcome.rsponseCode = status;
    if(!outcomeSent){
      workers.procesCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //bind the error even to it doesn't get thrown
  req.on('error', function(e){
    //update the checkOutcome and pass the data
    checkOutcome.error = {'error': true, 'value': e };
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // bind to the timeout event
  req.on('timeout', function(e){
    //update the checkOutocme and pass the data along
    checkOutcome.error = { 'error': true, 'value': 'timeout' };
    if(!outcomeSent){
      workers.processCheckOutcome(originaCheckData.checkOutcome);
      outcomeSent = true;
    }
  });

  //end request
  req.end();
};

//process the check outcome, update the check data as needed, trigger alert to user
//special logic fo check that has never been tested before (don't send to user)
workers.processCheckOutcome = function(originalCheckData, checkOutcome){
  
  //decide if the check is 
  const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode)> -1 ? 'up' : 'down';

  //decide if an alert is warranted
  const alestWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
  
  //update the check data
  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Data.now();

  //save updates
  _data.update('checks', newCheckData.id, newCheckData, function(err){
    if(!err){
      //send the new check data to the next step if needed
      if(alertWarranted){
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('check outcome has not changes, no alert needed');
      }
    } else{
      console.log('Error trying to save updates to one of the checks');
    }
  });
};

//alert use as to change their check status
workers.alertUserToStatusChange = function(newCheckData){
  const msg = 'Alert: Your check for' + newCheckData.method.tuUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url +' is currently ' + newCheckData.state;
  helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
    if(!err){
      console.log('Success: User was alerted to a status change in ther check, via sms: ', msg);
    } else {
      console.log('Error: Could not send sms alert to user who had a state change in their check');
    }
  });
};

//Timer to execute workers process once per minute
workers.loop = function(){
  setInterval(function(){
    workers.gatherAllChecks();
  }, 1000 * 60)
};

//Init worker
workers.init = function(){

  //Execute all the checks immediatelly
  workers.gatherAllChecks();

  //Call the loop so the checks will execute later on
  workers.loop();
};


//Export module
module.exports = workers;