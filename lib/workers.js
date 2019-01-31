/*
*   Uptime Tunnel
*   Worker-related tasks
*/

//Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const http = require('http');
const https = require('https');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');
const util  = require('util');
const debug = util.debuglog('workers');

// Instatiate Worker Object
const workers = {};

//lookup all checks, get data and send a validator
workers.gatherAllChecks = function(){
  // Get all the checks
  _data.list('checks', function(err, checks){
    if(!err && checks && checks.length > 0){
      checks.forEach(function(check){
        // Read in the check data
        _data.read('checks', check, function(err, originalCheckData){
          if(!err && originalCheckData){
            // Pass it to the check validator, and let that function continue the function or log the error(s) as needed
            workers.validateCheckData(originalCheckData);
          } else {
            debug("Error reading one of the check's data: ", err);
          }
        });
      });
    } else {
      debug('Worker Check: Error: Could not find any checks to process');
    }
  });
};

//Sanity-check the check-data **
workers.validateCheckData = function(originalCheckData){
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http','https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' &&  ['post','get','put','delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;
  // Set the keys not be set (if the workers have never seen this check before)
  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // If all checks pass, pass the data along to the next step in the process **
  if(originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds){
      workers.performCheck(originalCheckData);
  } else {
    // If checks fail, log the error and fail silently
    debug("Error: one of the checks is not properly formatted. Skipping.");
  }
};

//perform the check, send the originalCheckData and the outcome to the check process to next step
workers.performCheck = function(originalCheckData){
  
  //prepare the initial check outcome
  var checkOutcome = {
    'error' : false,
    'responseCode' : false
  };

  // Mark that the outcome has not been sent yet
  let outcomeSent = false;

  //Parse the hostname and the path of the original check data
  var parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path; // Using path not pathname because we want the query string

  //construct the request
  var requestDetails = {
    'protocol' : originalCheckData.protocol + ':',
    'hostname' : hostName,
    'method' : originalCheckData.method.toUpperCase(),
    'path' : path,
    'timeout' : originalCheckData.timeoutSeconds * 1000
  };

  //Instantiate the request object (using either the http or https module) **
  var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  var req = _moduleToUse.request(requestDetails,function(res){
      // Grab the status of the sent request
      var status =  res.statusCode;

      // Update the checkOutcome and pass the data along
      checkOutcome.responseCode = status;
      if(!outcomeSent){
        workers.processCheckOutcome(originalCheckData,checkOutcome);
        outcomeSent = true;
      }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error',function(e){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {'error' : true, 'value' : e};
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout',function(){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {'error' : true, 'value' : 'timeout'};
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
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
  const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  //decide if an alert is warranted
  const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
  
  //log the outcome
  const timeOfCheck = Date.now();
  workers.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

  //update the check data
  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;
  
  //save updates
  _data.update('checks', newCheckData.id, newCheckData, function(err){
    if(!err){
      //send the new check data to the next step if needed
      if(alertWarranted){
        workers.alertUserToStatusChange(newCheckData);
      } else {
        debug('check outcome has not changes, no alert needed');
      }
    } else{
      debug('Error trying to save updates to one of the checks');
    }
  });
};

//alert use as to change their check status
workers.alertUserToStatusChange = function(newCheckData){
  const msg = 'Alert: Your check for' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url +' is currently ' + newCheckData.state;
  helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
    if(!err){
      debug('Success: User was alerted to a status change in ther check, via sms: ', msg);
    } else {
      debug('Error: Could not send sms alert to user who had a state change in their check', err);
    }
  });
};

// send check to a log file
workers.log = function(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck){
  //form log data
  const logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state': state,
    'alert': alertWarranted,
    'time': timeOfCheck
  };

  //convert data to string
  const logString = JSON.stingify(logData);
 
  //determine the name of log file
  const logFileName = originalCheckData.id;

  //append log string to the file
  _log.append(logFileName, logString, function(err){
    if(!err){
      debug('Logging to file successful');
    } else {
      debug('logging to file failed')
    }
  });

};

//Timer to execute workers process once per minute
workers.loop = function(){
  setInterval(function(){
    workers.gatherAllChecks();
  }, 1000 * 60)
}; 

//rotate (compress) the log files **
workers.rotateLogs = function(){
  // List all the (non compressed) log files
  _logs.list(false,function(err,logs){
    if(!err && logs && logs.length > 0){
      logs.forEach(function(logName){
        // Compress the data to a different file
        var logId = logName.replace('.log','');
        var newFileId = logId+'-'+Date.now();
        _logs.compress(logId,newFileId,function(err){
          if(!err){
            // Truncate the log
            _logs.truncate(logId,function(err){
              if(!err){
                debug("Success truncating logfile");
              } else {
                debug("Error truncating logfile");
              }
            });
          } else {
            debug("Error compressing one of the log files.",err);
          }
        });
      });
    } else {
      debug('Error: Could not find any logs to rotate');
    }
  });
};

//Timer to execute log rotation once per day
workers.logRotationLoop = function(){ 
  setInterval(function(){
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
}

//Init worker script
workers.init = function(){

  // send to console in YELLOW  **** '\x1b[33m %s \x1b[0m' 33 is yellow ****
  console.log('\x1b[33m %s \x1b[0m', 'Background workers are running');
  
  //Execute all the checks immediatelly
  workers.gatherAllChecks();

  //Call the loop so the checks will execute later on
  workers.loop();

  //comprees the logs immediatelly
  workers.rotateLogs();

  //call the compression loop so logs will be compressed later on
  workers.logRotationLoop();
  
};


//Export module
module.exports = workers;