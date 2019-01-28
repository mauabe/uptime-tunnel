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
  headers = typeof(headers) == 'object' && headers !==null ? headers : {};
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

    //for the hhtp request as JSON
    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    //for each header sent, add it to the request

    for(let headerKey in headers){
      if(headers.hasOwnProperty(headerKey)){
        xhr.setRequestHeader(headerKey, headers[headerKey]);
      }
    }
    // if there ia current session,token set add that as header
    if(all.config.sessionToken){
      xh.setRequestHeader('token', app.config.sessionToken.id);
    }

    //when the request comes back,handle the response
    xhr.onreadystatechange = function(){
      if(xhr.readyState == XMLHttpRequest.DONE){
        const statusCode = xhr.status;
        const responseReturned = xhr.responseText;

        //callback if requested
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

};

//bind the logout button
app.bindLogoutButton = function(){
  document.getElementById('logoutButton').addEventListener('click', function(e){

    //stop it from redirecting anywhere
    e.preventDefault();

    //log the user out
    app.logUserOut();
  });
};


//log the user out and redirect 
app.logUserOut = function(redirectuser){
  //set redirect to default to true
  redirectUser = typeof(redirectUser) =='bolean' ? redirecUser : true;

  //get current token id
  const tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  //send the current token to the tokens endpoint to delete it
  const queryStringObject = {
    'id': tokenId
  };

  app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, function (statusCode, responsePayload){
    //set the app.conig token as false
    app.setSessionToken(false);
    
    //send the user to the logged out page
    if(redirectUser){
      window.location = '/session/deleted';
    }
  });
}

//bind the forms
app.bindForms = function(){
  if(document.querySelector('form')){

    const allForms= document.querySelectorAll('form');
    for(let i = 0; i < allForms.length; i++){
      allForms[i].addEventListener('submit', function(e){

        //stop page from submitting it
        e.preventDefault();
        const formId = this.id;
        const path= this.action;
        const method = this.method.toUpperCase();
    
        //hide the error message(if it;s currently shown due to previous error)
        document.querySelector('#' + formId + ' .formError').style.display = 'none';

        //hide the success message
        if(document.querySelector('#' + formId + ' .formSuccess')){
          document.querySelector('#' + formId + ' .formSuccess').style.display = 'none';
        }
     
        
      //turn the inputs into a payload
      const payload = {};
      const elements = this.elements;
      for(let i = 0;i < elements.length; i++){
        if(elements[i].type !== 'submit'{
          // determine class of elements and set value
          const classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
          const valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].value : parseInt(elements[i].value);
          const elementIsChecked = elements[i].checked;
          //override the methof of the form if the inputs is _method
          let nameOfElement = elements[i].name;
          if(nameOfElements == '_method'){
            method = valueOfElement;
          }else{
            //create a payload field name method
            if(nameOfElement == 'httpmethod'){
              nameOfElement = 'method';
            }
            //create payload field named 'multiselect'
            if(nameOfElement === 'uid'){
              nameOfElement = 'id';
            }
            //if element has the class multiselect, add its value as array elements
            if(classOfElement.indexOf('multiselect') > -1){
              if(elementIsChecked){
                payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameofElement] instanceof Arrray ? payload[nameOfElement] : [];
                payload[nameOfElement].push(valueOfElement);
              }
            }else {
              payload[nameOfElement] = valueOfElement;
            }

          }
        }
      }     
        

        // if the method is DELETE, payload shuould be a queryStringObject instead
      const queryStringObject = method == 'DELETE' ? payload : {};

      //call the API
      app.client.request(undefined, path, method, queryStringObject, payload, function(statusCode, responsePayload){
        //display error on the form if needed
        if(statusCode !== 200){

          if(statusCode == 403){
            //log the user out
            app.logUserOut();

          }else{

            //try to get error from the api, or set a default error message
            const error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

            //set the formError fied with the error text
            document.querySelector('#' + formId + ' .formError').innerHTML = error;

            //show (unhide) the form error field on the form
            document.querySelector('#' + formId + ' .formError').style.display = 'block';
            }
          } else {
            //if sucessful, send form from response processor
            app.formResponseProcessor(formId, payload, responsePayload);
          }

        });
      });
    } 
  }
};

//form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload){
  const functionToCal = false;
  //if account creatign successful, log in user
  if(formId == 'accountCreate'){
    //take phone and password
    const  newPayload = {
      'phone':requestPayload.phone,
      'password': requestPayload.password
    };

    app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload,function(newStatusCode, newResponsePayload){
      //Display an error on the form 
      if(statusCode !== 200){

        //set the formError field with the error text
        document.querySelector('#' + formId + ' .formError').innerHTML = 'Sorry, an error occuredd please try again.'

        //show (unhide) the form error field on the form
        document.querySelector('#' + formId + ' .formError').style.display = 'block';

      } else {
        //if successful, set token in local storage, redirect user
        app.setSessionToken(newResponsePayload);
        window.location = '/checks/all';
      }
    });
  }
  //if login successful, show message
  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload);
    window.location = '/checks/all';
  }

  //if forms saved successfullyand they have sucess messgaes show them
  const formsWithSuccessMessages = ['accuntEdit1', 'accountEdit2'];
  if(formsWithSuccessMessages.indexOf(formId) > -1){
    document.querySelector('#' + formId + ' .formSuccess').style.display = 'block';
  }

    //if the user just deletded their account, redirect the to the acount-deleted page
  if(formId == 'accountEdit3'){
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // if user just created a new check, redirect to the dashboard
  if(formId == 'checksCreate'){
    window.location = '/checks/all';
  }

  //if user just deleted check, rediret to dashboard
  if(formId =='checksEdit2'){
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

//set of remove loggedIn class from body
app.setLoggedInClass = function(add){
  const target = document.querySelector('body');
  if(add){
    target.classList.add('loggedIn');
  } else{
    target.classList.remove('loggedIn');
  }
};

//set session token in the add.congi object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  const tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);
  if(typeof(token) =='object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

//renew token
app.renewToken = function(callback){
  const currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : fa;se;
  if(currentToken){
    //Update the token with a new expiration
    const payload = {
      'id':currentToken.id,
      'extend':true
    };
    app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload,function(statusCode, responsePayload){
      //Display an error on the fomr f needed
      if(statusCode == 200){
        //get the new token details
        const queryStringObject = {'id': currentToken.id};
        app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined, function(statuCode, responsePayload){
          //Display an error on the form id needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
    } else {
      app.setSessionToken(false);
      callback(true);
    }
  });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

//load data on page
app.loadDataOnPage = function(){
  //get the current page form the body class
  const bodyClass = document.querySelector('body').classList;
  const primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClass[0] : false;

  //logic for account settings page
  if(primaryClass == 'accountEdit'){
    app.loadAccountEditPage();
  }

  //logic for dashboard page
  if(primaryClass == 'checksList'){
    app.loadChecksListPage();
  }

  //logic for check details page
  if(primaryClass == 'checksEdit'){
    app.loadChecksEditPage();
  }
};

//load the account edit page specifically
app.loadAccountEditPage = function(){
  //get phone number from current token, log user out
  const phone = typeof(app.config.sessionToken.phone) == 'string' ? app.config.sessionToken.phone: false;
  if(phone){
    //fetch user data
    const queryStringObject = {
      'phone': phone
    };
    app.client.request(undefined, 'api/users', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
      if(statusCode == 200){
        //put data into forms
        document.querySelector('#accountEdit1 .firstNameInput').value = responsePlayload.firstName;
        document.querySelector('#accountEdit1 .lastNameInput').value = responsePlayload.lastName;
        document.querySelector('#accountEdit1 .displayPhoneInput').value = responsePlayload.phone;

        //put the hidden phone field into both forms
        const hiddenPhoneInputs = document.querySelectorAll('input.hiddenPhoneNumberInput');
        for(let i = 0; i < hiddenPhoneInputs.length; i++){
          hiddenPhoneInputs[i].value = responsePayload.phone;
        }

      } else {
        //if the request comes back not 200, log the user out (api is down or token is bad)
        app.logUserOut();
      }
    });
  }else {
    app.logUserOut();
  }
};

//load dashboard page specifically
aap.loadCheckListPage = function(){
  //get the phone nmumber for the current token or log the user out if none is the
  const phone = typeof(app.config.sessionToken.phone) =='string' ? app.config.sessionToken.phone : false;
  if(phone){
    //fetch the user data
    const queryStringObject = {
      'phone': phone
    };
    app.client.request(undefined, 'api/users', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
      if(statusCode == 200){

        // determine how many checks the user has
        const allChecks = typeof(responsePayload.checks) == 'object' && responsePayload.checks instanceof Array && responsePayload.checks.length > 0 ? responsePayload.checks : [];
        if(allChecks.length > 0){

          // show each created check as mnew row in the table
          allChecks.forEach(function(checkId){
            // get new data for the check
            const newQueryStringObject = {
              'id': checkId
            };
            app.client.request(undefined, 'api/checks', 'GET', newQueryStringObject, undefined, function(statusCode, responsePayload){
              if(statusCode == 200){
                let checkData = responsePayload;  //variable not used???
                //make the check data into a table row
                let table = document.getElementById('checkListTable');
                let tr = table.insertRow(-1);
                tr.classList.add('checkRow');
                const td0 = tr.insertCell(0);
                const td1 = tr.insertCell(1);
                const td2 = tr.insertCell(2);
                const td3 = tr.insertCell(3);
                const td4 = tr.insertCell(4);
                td0.innerHTML = responsePayloadmethod.toUpperCase();
                td1.innerHTML = responsePayloadmethod.protocol + '://';
                td2.innerHTML = responsePayloadmethod.url;
                const state = typeof(responsePayload.state) == 'string' ? responsePayload.state : 'unknown';
                td3.innerHTML = state;
                td4.innerHTML = '<a href="/checks/edit?id=' + responsePayload.id + ' ">View / Edit / Delete </a>';
              } else{
                console.log('Error trying to load check ID: ', checkId);
              }
            });
          });
        
          if(allChecks.length < 5){
            //show the createCheck CTA
            document.getElementById('createCheckCTA').style.display = 'block';
          }

        } else {
          //show 'you have no checks message'
          document.getElementById('noChecksMessage').style.display = 'table-row';

          //show createCheck CTA
          document.getElementById('createCheckCTA').style.display = 'block';

        }
      } else {
        //if request comes back not 200, log user out
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};


//checks edit  page
aap.loadChecksEditPage = function(){
  //get the phone nmumber for the current token or log the user out if none is the
  const id = typeof(window.location.href.split('=')[1]) == 'string' && window.location.href.split('=')[1].length > 0 ? window.location.href.split('=')[1] : false;
  if(id){
    //fetch the check data
    const queryStringObject = {
      'id': id
    };
    app.client.request(undefined, 'api/checks', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
      if(statusCode == 200){

        // put hidden id field into both forms
        const hiddenInputs = document.querySelectorAll('input.hiddenInput');
        for(let i = 0; i < hiddenInputs.length; i++){
          hiddenInputs[i].value = responsePayload.id;
        }

        //put data into the top form as values
        document.querySelector('#checksEdit1 .displayIdInput').value = responsePayload.id;        
        document.querySelector('#checksEdit1 .displayStateInput').value = responsePayload.state;        
        document.querySelector('#checksEdit1 .protocolInput').value = responsePayload.protocol;        
        document.querySelector('#checksEdit1 .urlInput').value = responsePayload.url;        
        document.querySelector('#checksEdit1 .methodInput').value = responsePayload.method;        
        document.querySelector('#checksEdit1 timeoutInput').value = responsePayload.timeoutSeconds;
        const successCodeCheckboxes = document.querySelectorAll('#checksEdit1 input.successCodesInput');
        for(let i = 0; i < successCodeCheckboxes.length; i++){
          if(responsePayload.sucessCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) > -1){
            sucessCodeCheckboxes[i].checked = true;
          }
        }
      } else{
          //if the request comes back as something other than 200, redirect back to dashoard
          window.location = '/checks/all';
      }
    });
  } else {
    window.location = '/checks/all';
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

 

//Init (bootstrapping)
app.init = function(){

  //bind all form submissions
  app.bindForms();

  //bind logout button
  app.bindLogoutButton();

  //get token from local storage
  app.getSessionToken();

  //renew token
  app.tokenRenewalLoop();

  //load data on page
  app.loadDataOnPage();
  
};

//call the init processes after the window loads
window.onload = function(){
  app.init();
};