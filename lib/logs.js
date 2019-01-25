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
 
//list all log and optionally include compressed logs
lib.list = function(includeCompressedLogs, callback){
  fs.readdir(lib.baseDir, function(err, data){
    if(!err && data && data.length > 0){
      const trimmedFileNames = [];
      data.forEach(function(fileName){
        //add .log files
        if(fileName.indexOf('.log') > -1){
          trimmedFileNames.push(fileName.replace('.log', ''));
        } 

        // add on the .gz files
        if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
          trimmedFileNames.push(fileName.replace('.gz/b64'), '');
        }
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    } 
  });
};

//compress the contenct of one .log file into .gx.b64 within the same directory
lib.compress = function(logId, newFileId, callback){
  const sourceFile = logId + '.log';
  const destFile = newFileId + '.gz.b64';
  
  //read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf8', function(err, inputString){
    if(!err && inputString){
      //compress the data using gzip
      zlib.gzip(inputString, function(err, buffer){
        if(!err & buffer){
          //send the data to destination file
          fs.open(lib.baseDir + destFile , 'wx', function(err, fileDescriptor){
            if(!err && fileDescriptor){
              //write to teh destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err){
                if(!err){
                   //close desitination file
                   fs.close(fileDescriptor, function(err){
                     if(!err){
                       callback(false);
                     } else{ 
                       callback(err);
                     }
                   });
                } else {
                  callback(err);
                }
              });
            } else{
            callback(err);
            }
          });
        } else {
        callback(err);
        }
      });
    } else{
callback(err);
    }
  });
};


//decompress he contents of .gz.b64 into a string variable
lib.decompress = function(fileId, callback){
  const fileName = fileId + '.gz.b64';
  fs.readFile(lib.baseDir + fileName, 'utf8', function(err, str){
    if(!err && str){
      //decompres the data
      const inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, function(err, outputBuffer){
        if(!err && outputBuffer){
        //callback
        const str = outputBuffer.toString();
        callback(false, str);
        } else {
          callback(err);
        }
      });
    } else { 
      callback(err);
    }
  });
}

//truncate a log file

lib.runcate = function(logId, callback){
  fs.truncate(lib.baseDir + logId + '.log', 0, function(err){
    if(!err){
      callback(false);
    } else {
      callback(err);
    }
  });
}

//export module
module.exports = lib;