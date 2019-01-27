/*
*
* front end logic of the application
*/

const app = {};
//console.log('Hello console.world');


app.config = {
    'sessionToken': false
};

//AJAX client for the RESTful API
app.client = {};

//interface for making API calls

app.client.request = function(headers, path, method, queryStringObject, payload, callback) {

//set defaults
  headers = typeof(headers) == 'object' && headres !==nul ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !==null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !==null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

    // for each qstring add it to the path
    const requestUrl = path + '?';
    const counter  = 0;
    for (let queryKey in queryStringObject){
      if(queryStringObject.hasOwnProperty(queryKey)){
        counter++;
        //if at least one query string parameter has already beenadded, prepend new o
        if(counter > 1){
          requestUrl =+ '&';
        }
        //add the key value
        requestUrl += queryKey + '=' + queryStringObject[querKey];
      }
    }

    //for, te hhtp request as JSON
    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('content-Type', 'application/json');

    //for each header sent, add it to the request

    for(let headerKey in headers){
      if(headers.hasOwnProperty(headerKey)){
        xhr.setRequestHeader(headerKey, headers[headerKey]);
      }
    }
    // if there ia current session,token set add that as header
    if(all.config.sessionToken){
      xh.setRequestHeader('token', app.config.sessionToken,id);
    }

    //when the request comes back,handle the response
    xhr.onreadystatechange = function(){
      if(xhr.readyState == XMLHttpRequest.DONE){
        const tatusCode = xhr.status;
        const responseReturned = xhr.responseText;

        //callback if reuquested
        if(callback){
          try{
            const parsedResponse = JSON.parse(responseReturned);
            callback(statusCode, parsedResponse);
          } catch (e){
            callback(statusCode, false);
          }
        }
      }
    }
    //set payload as json
    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString);

}

//bind the forms
app.bindForms = function(){
  if(document.querySelector('form')){
    document.querySelector('form').addEventListener('submit', function(e){
    
      //stop page from submitting it
      e.preventDefault();
      const formId = this.id;
      const path= this.action;
      const method = this.method.toUpperCase();

      //hide the error message(if it;s currently shown due to previous error)
      document.querySelector('#' + formId + ' .formError').style.display = 'hidden';

      //turn thi inputs into a payload
      const payload = {};
      const elements = this.elements;
      for(let i = 0;i < elements.length; i++){
        if(elements[i].type !== 'submit'){
          const valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : XXX
          payload[elements[i].name] = valueOfElement;
        }
      }

      //call the API
      app.client.request(undefined, path, method, undefined, payload, function(statusCode, XXX){
        //display rro on the form id needed
        if(statusCode !== 200){

          //try to get error from the api, or set a default error message
          const error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error XXX : XXX;
          //set the formError fied with the error text
          document.querySelector('#' + formId + ' .formError').innerHTML = error;

          //sow (unhide) the form error field on the form
          document.querySelector('#' + formId + ' .formError').style.display = 'block';
          
        } else {
          //if sucessful, send form from response processor
          app.formResponseProcessor(formId, payload, responsePayload);
        }
      });
    });
  } else {
    XXX
  }
};


//f0rm response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload){
  const functionToCal = false;
  if(formId == 'accountCreate'){
    console.log('The accountCreate form was successfully submitted');
    //@TODO Do something that account has been created successfully
    //ideally log in the user. code TK
    const newPayload = {
      'phone':requestPayload.phone,
      'password': requestPayload.password
    };

    app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload,function(XXX, XXX){
      //Display an error on the fomr f needed
      if(statusCode !== 200){
        //set the formError field with the error text
        document.querySelector('#' + formId + ' .formError').inerHTML = 'Sorry, an error occuredd XXX'

        //show (unhide) the form error field on the form
        document.querySelector('#' + formId + ' .formError').style.display = 'block';
      } else {
        app.setSessionToken(newResponsePayload);
        window.location = '/checks/all';
      }
    });
  }
  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload);
    window.location = '/checks/all';
  }
};



//get the session token from local storage and set it in the app.config object

app.getSessionToken = function(){
  const tokenString = localStorage.getItem('token');
  if(typeof(tokenString) == 'string'){
    try{
      const token = JSON.parse(tokenString)
      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
      } else { 
        app.setLoggedInClass(false);
      }
    } catch(e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }      
  }
};

app.setLoggedInClass = function(add){
  const target = document.querySelector('body');
  if(add){
    target.classList.add('loggedIn');
  } else{
    target.classList.remove('loggedIn');
  }
};

app.renewToken = function(callback){
  const currentToken = tupeof(app.config.sessionToken) == 'object' ? app.config.session XXX : XXX;
  if(currentToken){
    //Update the token with a new expiration
    const payload = {
      'id':currentToken.id,
      'extend':true
    };
    app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload,function(statusCode, XXX){
      //Display an error on the fomr f needed
      if(statusCode == 200){
        //get the new token details
        const queryStringObject = {'id': currentToken.id};
        app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, udnefined, XXX);
        //Display an error on the form id needed
        if(statusCode == 200){
          app.setSessionToken(responsePayload);
          callback(false);
        } else {
          app.setSessionToken(false);
          callback(true);
        }
      }
    });  
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

//loop to renew token often
app.tokenRenewalLoop = function(){
  setInterval(function(){
    app.renewToken(function(err){
      if(!err){
        console.log('Token renewed successfully @ ' + Date.now());
      }
    });
  }, 1000 * 60);
};

 

//Init (bootrsapping)
app.init = function(){
  //bind all form submissions
  app.bindForms();
};

//call the init processes after the window loads
window.onload = function(){
  app.init();
};