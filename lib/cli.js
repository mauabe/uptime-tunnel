/*
*   CLI tasks

*/

//dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
class _events extends events{};
const e = new _events();
const os = require('os');
const v8 = require('v8');
const _data = require('./data');
const _logs = require('./logs');
const helpers = require('./helpers');

// instantiate the CLI module object
const cli = {};

// input handlers
e.on('man',function(str){
  cli.responders.help();
});

e.on('help',function(str){
  cli.responders.help();
});

e.on('exit',function(str){
  cli.responders.exit();
});

e.on('stats',function(str){
  cli.responders.stats();
});

e.on('list users',function(str){
  cli.responders.listUsers();
});

e.on('more user info',function(str){
  cli.responders.moreUserInfo(str);
});

e.on('list checks',function(str){
  cli.responders.listChecks(str);
});

e.on('more check info',function(str){
  cli.responders.moreCheckInfo(str);
});

e.on('list logs',function(str){
  cli.responders.listLogs();
});

e.on('more log info',function(str){
  cli.responders.moreLogInfo(str);
});


// responders object
cli.responders = {};

// help / man
cli.responders.help = function(){

  //command explanations
  const commands ={
    'exit': 'Kill the CLI (and the rest of the application)',
    'man': 'Shows this page',
    'help': 'Shows this page',
    'stats': 'Gets statistics on the underlying operating system and resources',
    'list users': 'Shows a list of all registered (undeleted) users in the system',
    'more user info --{userId}': 'Show information on a specific user',
    'list checks  --up --down': 'Shows a list of all active checks / states. The "--up" and "--down" flags are optional',
    'more check info --{checkId}': 'Shows details of a specified check',
    'list logs': 'Shows a list of all log files available (compressed only)', 
    'more log info --{fileName}': 'Shows details of a specified log file'
  };

  //show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('UPTIME TUNNEL CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  //show each command, followed by its explantion in white and yellow
  for(let key in commands){
    if(commands.hasOwnProperty(key)){
      let value = commands[key];
      let line = '\x1b[33m' + key + '\x1b[0m'; 
      let padding = 45 - line.length;
      for (let i = 0; i < padding; i++){
        line += ' ';
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }
cli.verticalSpace(1);

//end with another horizontal line
cli.horizontalLine();

};

//create vertical space
cli.verticalSpace= function(lines){
  lines = typeof(lines) == 'number' && lines > 0 ? lines: 1;
  for(let i = 0; i < lines; i++){
    console.log('');
  }
};

//create horizontal line across screen
cli.horizontalLine = function(){

  //get the available screen size
  let width = process.stdout.columns;

  //put enough dashes to go accross the screen
  let line = ''; 
  for(let i = 0; i < width; i++){
    line += '=';
  }
  console.log(line);


};

//create centered text on screen
cli.centered = function(str){
  str = typeof(str) =='string' && str.trim().length > 0 ? str.trim() : '';
  
  //get the available screen size
  let width = process.stdout.columns;

  //get available screen size
  let leftPadding = Math.floor((width - str.length) / 2);

  //put left padded psaces before the string
  let line  = '';
  for(let i = 0; i < leftPadding; i++){
    line += ' ';
  }
  line += str;
  console.log(line);
}

//exit
cli.responders.exit = function(){
  process.exit(0);
}

//stats
cli.responders.stats = function(){
  //compile object stats
  const stats = {
    'Load Average': os.loadavg().join(' '),
    'CPU Count': os.cpus().length,
    'Free Memory':os.freemem(),
    'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Used (%)': Math.round(( v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)': Math.round(( v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
    'System Uptime':os.uptime() + ' Seconds',
  };

  // header for stats
  cli.horizontalLine();
  cli.centered('UPTIME TUNNEL SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  //log out each stat
   for(let key in stats){
    if(stats.hasOwnProperty(key)){
      let value = stats[key];
      let line = '\x1b[33m' + key + '\x1b[0m'; 
      let padding = 45 - line.length;
      for (let i = 0; i < padding; i++){
        line += ' ';
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  } 

  //create footer for stats
  cli.verticalSpace(1);
  cli.horizontalLine();

};

//list users +++
cli.responders.listUsers = function(){
  _data.list('users', function(err, userIds){
    if(!err && userIds && userIds.length > 0){
      cli.verticalSpace();
      userIds.forEach(function(userId){
        _data.read('users', userId, function(err, userData){
          if(!err && userData){
            let line = 'Name: ' + userData.firstName + ' ' + userData.lastName + ' Phone: ' + userData.phone + ' Checks: ';
            let numberOfChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;
            line += numberOfChecks;
            console.log(line);
            cli.verticalSpace();
          }
        });
      });
    }
  });
};

//more user info
cli.responders.moreUserInfo = function(str){
  //get id from string provided
  const arr = str.split('--');
  const userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(userId){
    //lookup user
    _data.read('users', userId, function(err, userData){
      if(!err && userData){
        //remove hashed password
        delete userData.hashedPassword;

        //print JSON with text highlighting
        cli.verticalSpace();
        console.dir(userData, {'colors' : true});
        cli.verticalSpace();
      }
    });
  }
};


//list checks +++
cli.responders.listChecks = function(str){
  _data.list('checks',function(err,checkIds){
    if(!err && checkIds && checkIds.length > 0){
      cli.verticalSpace();
      checkIds.forEach(function(checkIdd){
        _data.read('checks',checkIdd,function(err,checkData){
          if(!err && checkData){
            var includeCheck = false;
            var lowerString = str.toLowerCase();
            // Get the state, default to down
            var state = typeof(checkData.state) == 'string' ? checkData.state : 'down';
            // Get the state, default to unknown
            var stateOrUnknown = typeof(checkData.state) == 'string' ? checkData.state : 'unknown';
            // If the user has specified that state, or hasn't specified any state
            if((lowerString.indexOf('--'+state) > -1) || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)){
              var line = 'ID: '+checkData.id+' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol+'://'+checkData.url+' State: '+stateOrUnknown; //checkData.method.toUpperCase()
              console.log(line);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};
 
// more check info
cli.responders.moreCheckInfo = function(str){
  //get id from string provided
  const arr = str.split('--');
  const checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(checkId){
    //lookup check
    _data.read('checks', checkId, function(err, checkData){
      if(!err && checkData){

        //print JSON with text highlighting
        cli.verticalSpace();
        console.dir(checkData, {'colors' : true});
        cli.verticalSpace();
      }
    });
  }
};

//list logs
cli.responders.listLogs = function(){
  _logs.list(true, function(err, logFileNames){
    if(!err && logFileNames && logFileNames.length >0){
      cli.verticalSpace();
      logFileNames.forEach(function(logFileName){
        if(logFileName.indexOf('-') > -1){
          console.log(logFileName);
            cli.verticalSpace();
        }
      });
    }
  });
};

//more logs info
cli.responders.moreLogInfo = function(str){
  //get logFileName from string provided
  const arr = str.split('--');
  const logFileName = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(logFileName){
    cli.verticalSpace();
    //decompress log
    _logs.decompress(logFileName, function(err, strData){
      if(!err && strData){
        //split into lines
        let arr = strData.split('\n');
        arr.forEach(function(jsonString){
          const logObject = helpers.parseJsonToObject(jsonString);
          if(logObject && JSON.stringify(logObject) !== '{}'){
            console.dir(logObject, {'colors' : true});
            cli.verticalSpace();
          }
        });
      }
    });
  }
};

//input processor
cli.processInput = function(str){
  str = typeof(str) == 'string' & str.trim().length > 0? str.trim() : false;  
  //only process the input if user wrote something, otherwise ignore it
  if(str){
  //codify the unique strings that identify unique questions allowew to ask
    const uniqueInputs =[
      'man',
      'help',
      'exit',
      'stats',
      'list users',
      'more user info',
      'list checks',
      'more check info',
      'list logs', 
      'more log info'
    ];
    
    // iterate over possible inputs, emir event that matches
    let matchFound = false;
    let counter = 0;   // variable not used???
    uniqueInputs.some(function(input){
      if(str.toLowerCase().indexOf(input) > -1){
        matchFound = true;
        //emit an event matching unique input and include full string given by user
        e.emit(input, str)
        return true;
      }
    });
    
    //if no match found, tell user to try again
    if(!matchFound){
      console.log('Sorry, command not recognized, please try again or type "man" for help');
    }
  }
};


//init script
cli.init = function(){

  //send the start message to the console in dark blue
  console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

  ///start the interface
  const _interface = readline.createInterface({
    input: process.stdin, 
    putput: process.stdout,
    prompt: ''
  });

  //create initial prompt
  _interface.prompt();

  //handle each line of input separately
  _interface.on('line', function(str){

    //send to input processor
    cli.processInput(str);

    //re-initialize prompt afterwards
    _interface.prompt();
  });

  //if user stopCLI, kill associated processess
  _interface.on('close',function(){
    process.exit(0);
  });

};

// export module
module.exports = cli;