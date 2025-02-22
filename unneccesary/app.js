const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport')
const local = require('passport-local').Strategy
const session = require('express-session')
const app = express()

function verify(username, password, done){
    try{
        const isValid = validate(password, user.hash, user.salt) //The actual function that validates whether the user input the correct credentials.
        if(isValid){
            done(null, user)
        }
        else{
            done(null, false)
        }
    }catch(err){
        done(err)
    }
}

//The done function passed in the verify function is like the next function passed in the custom middleware functions that we create.
//In middleware functions, we call next() to go to the next middlware, and next(err) to go to an error handler if an error occurs.
//Similarly, the done function takes 3 parameters (next takes 1): done(err, user, info)
//Just as next() signals the completion of current middleware, done() must be called within the auth function to signal the completion of authentication.
//But unlike next() in which we pass error object only when an error occurs, otherwise pass nothing,
//Two of the parameters must be passed in done(): err and user.
//Pass null for error if no error occured.
//If the authentication fails, pass false for the user parameter, else pass the name given to the user document (the document from the database that matches user credentials)
//info is an optional argument that is used to pass aditional information about the auth result.
//THE VERIFY CALL BACK FUNCTION MUST RETURN THE DONE FUNCTION (RETURN IT, DON'T CALL IT.)

const strategy = new local({options}, verify) //Creates an instance of the local strategy object within the passport-local module
//This expects a call back function to be passed within it.
//This callback function is meant to verify the incoming userdata.

//The options object is an optional parameter, but can be useful in correctly pointing passport to the correct username and password fields.
//By default, if the options object is not passed, passport expects that username will be found in req.body.username and password in req.body.password.
//But, the keys of the username and password in which they are stored in the body object of the req object depends on the name given to the html input fields of the username and password.
//remember that when data is posted using a form, it is posted in key value pairs where the keys are the names of corresponding input fields.
//if the data is posted using axios, it posts an object of key value pairs. In this case, the keys are defined by the developer passing the object to be posted in the axios method.
//So, we use the options object while creating a new strategy instance to correctly specify the key at which the username and password will be found in the req.body object.
{
    usernameField: 'key_of_username',
    passwordField: 'key_of_password'
}

passport.use(strategy) //uses the local strategy middleware on all the requests coming to passport

//But the strategy middleware is used on the 'passport' object and not on the 'app' object.
//But the http requests come to 'app' and not 'passport'.
//So how would passport know that an http request has come and starts the authentication?
//Basically, we have not yet connected our express app to passport module.
//And we do so by using the passport.authenticate() method as a middleware applied on the express app on the login and register routes.

app.use(passport.initialize())
app.use(passport.session())

app.post('/login', passport.authenticate('local'), (req, res)=>{})
//so when a request comes on the login route, passport intercepts it and starts authentication.

//Now, the passport.authenticate accepts an options object in which we can configure 2 important properties.
{
    successRedirect: 'url to redirect on after a successful login',
    failureRedirect: 'url to redirect on after a failed login'
}

//Now since we are handling which urls to redirect on based on the login conditions,
//We dont actually need to pass the (req, res)=>{} callback function in app.post():
app.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}))


//Now we start to connect the passport to sessions and authenticate users based on session cookies.

//There are 3 objects that are created within the req object due to the interplay of express-session and the passport js modules.
//1. Req.user: 
//2. Req.session: Stores only the session ID of a particular user as a cookie. This is persistent across requests, and sent with every request to the backend.
//3. Req.passport:



//Steps while creating a basic user authentication:
//1. Create app with express
//2. Use the express.static(), express.json() and express.urlencoded() middlewares
//3. Create instance of a connection to database
//4. Define user schema of the database
//5. Create a model(or collection) using the shema and connection instance
//6. Use the session() on the app, and pass in the neccessary parameters like secret, store and cookie maxAge
//7. Create a validate function, and use it within a verify function to check if a user is verified or not.
//7. create a strategy using the passport-local and point the usernameField and passwordField to correct names of corresponding inputs in the options object, then pass the verification function.
//8. Initialize and sessionize passport using app.use()
//9. Use the strategy created above using passport.use()
//10. Create the passport.serializeUser() and passport.deserializeUser() functions.
//11. Use the passport.authenticate({}) middleware on the authenticating route to redirect user to correct page after authentication
//12. To check if the user is authenticated or not on any route, use the req.isAuthenticated() function along with an if check.
//13. To logout a user, use req.logout()
//14. To get the userID of the client sending the request, access app.session.passport.user, then get the data from the database instance.
//15. To get the data entered by the client in the fields, use req.body object.
//16. To store a new object in the database, use the .create() method on database instance and pass in the object.
//17. To generate a hashed password, we need to generate a pseudo-random salt using crypto.randomBytes() and the hash using cryto.pbkfd2Sync() and convert both into hexadecimal strings as .toString('hex')
