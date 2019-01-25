/*
*
*  Library to sstoring and rotating logs
*
*/

//Dependecies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

//containre for the module
const lib = {};
//base directory of the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');

// append a string to afile. create file if it does not exist.
lib.append = function(file, str, callback){
  // open file for appending
  fs.open(lib.baseDir + file + '.log', 'a', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      //append to file and close it
      fs.appendFile(fileDescriptor, str + '\n', function(err){
        if(!err){
          fs.close(fileDescriptor, function(err){
            if(!err){
              callback(false);
            } else{
              callback('Error closing the file that was being appended');        
            }
          });
        } else {
          callback('Error appending file');
        }
      });
    }else{
      callback('Error: could not open file for appending');
    }
  });
};
 

//export module
module.exports = lib;