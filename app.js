const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const crypto = require('crypto')
const port = 5000 || process.env.PORT
const app = express()
const path = require('path')

app.use(express.static('./public'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const mongoStore = require('connect-mongo');

const userSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String
})

const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/app', {useNewUrlParser: true, useUnifiedTopology: true})

const User = connection.model('user', userSchema)

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

// passport.deserializeUser(function(id, cb) {
//     User.findById(id, function (err, user) {
//         if (err) { return cb(err); }
//         cb(null, user);
//     });
// });

passport.deserializeUser(async function(id, cb) {
    try {
        const user = await User.findById(id);
        cb(null, user);
    } catch (err) {
        cb(err);
    }
});

// const sessionStorage = new mongoStore({mongooseConnection: connection, collection:'sessions'})

function validate(password, salt, hash){
    const hashed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    console.log(`Original Password: ${hash}`, `Entered Password: ${hashed}`)
    return hashed === hash
}


function verify(username, password, done){
    try{
        User.findOne({username: username})
        .then((user)=>{
            if(!user){
                console.log("user not found in database...")
                return done(null, false)
            }
            const isValid = validate(password, user.salt, user.hash)
            console.log("Is user valid?", isValid)
            if(isValid){
                console.log("verified user")
                return done(null, user)
            }
            else{
                console.log("Did not verify user due to wrong password")
                return done(null, false)
            }
        })
        
    }
    catch(err){
        done(err)
    }
}

app.use(session({
    secret:"kj34n2kjn$2", //Random string
    store: mongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/app'
    }),
    cookie:{
        maxAge: 1000*60*60*48
    },
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize())
app.use(passport.session())

const strategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, verify)

passport.use(strategy)

app.post('/login', (req, res, next) => {
    console.log("Login form data:", req.body);
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    })(req, res, next);
});
app.get('/login', async(req, res, next)=>{
    if(req.session.passport){
        if(req.session.passport.user){
            const user = await User.findById(req.session.passport.user)
            if(user){
                res.redirect('/')
                return
            }
        }
    }
    res.status(200).sendFile(path.join(__dirname, './login.html'))
})

app.get('/login/api/finduser', async(req, res, next)=>{
    if(req.session.passport.user){
        const user = await User.findById(req.session.passport.user)
        if(user){
            res.json({username: user.username})
            return
        }
    }
})


function genPassword(password){
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    console.log('Generated hashed password.')
    return {salt, hash}
}

app.post('/register', async(req, res, next)=>{
    const user = await User.findOne({username: req.body.username})
    if(user){
        res.redirect('/register')
        return
    }
    const salthash = genPassword(req.body.password)
    const salt = salthash.salt
    const hash = salthash.hash
    User.create({
        username: req.body.username,
        salt: salt,
        hash: hash
    })
    console.log("Stored User Data after registration.")
    res.redirect('/login')
})
app.get('/register', async(req, res, next)=>{
    if(req.session.passport){
    if(req.session.passport.user){
        const user = await User.findById(req.session.passport.user)
        if(user){
            res.redirect('/')
            return
        }
    }
}
    res.status(200).sendFile(path.join(__dirname, './register.html'))
})

app.get('/', (req, res, next)=>{
    if(req.isAuthenticated()){
        res.status(200).sendFile(path.join(__dirname, './home.html'))

    }else{
        console.log("Client was not authenticated.")
        res.status(200).sendFile(path.join(__dirname, './login.html'))

    }
})

// app.get('/logout', (req, res, next)=>{
//     req.logout()
//     console.log("Logged Out the")
// })

app.get('/logout', (req, res, next) => {
    req.logout((err) => { // Add callback function
        if (err) {
            return next(err); // Handle potential errors
        }
        console.log("Logged Out the user");
        res.redirect('/'); // Redirect after successful logout
    });
});

//Setup a server:
app.listen(port, ()=>{
    console.log(`Started listening on ${port}...`)
})