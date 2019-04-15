const express = require('express');
const bcrypt = require('bcrypt');
var router = express.Router();
const User = require('../models/users.model'); 
const languagesDB = require('../models/language.model');

router.get('/login', (req, res) => {
    res.render("userviews/loginUser",{
        success: req.flash('successMessage'),
        title: "Users Login Page",
        description : "This page will log-in the user",
        keywords: "Login into language test portal"
    });
});

router.post('/login', (req, res) => {
    const { email, password} = req.body;
    User.findOne({ email }, (error, user) => {
        if (user) {
          // compare passwords.
          bcrypt.compare(password, user.password, (error, same) => {
            if (same) {
              req.session.userid = user._id;
              req.session.fullname = user.fullname;
              req.session.dp = user.profile_image;
              req.session.email = user.email;
              res.redirect('/user/userpage');
            } else {
              req.flash('errorMessage', "Incorrect Password!");
              res.redirect('/user/login');
            }
          });
        } else { 
            req.flash('errorMessage', "User Not Found");
            res.redirect('/user/login');
        }
      })
});

router.get('/forgotpassword', (req, res) => {
    res.render("userviews/forgotPass",{
        success: req.flash('successMessage'),
        title: "Users Login Page",
        description : "This page will log-in the user",
        keywords: "Login into language test portal"
    });
});

router.get('/register', (req, res) => {
    res.render("userviews/registerUser",{
        title: "User Registeration Page",
        description : "This page will help you in creating your account",
        keywords: "Register your account for language test portal"
    });
});

router.post('/register', (req, res) => {
    //destructuring here
    const { fullname, email, password, repassword,  } = req.body;
    let valErrors = [];

    //check required feild
    if(!fullname || !email || !password || !repassword){
        valErrors.push({msg:"*All fields are mandatory"});
    }
    //matching 2 passwords
    if(password !== repassword){
        valErrors.push({msg:"Passwords do not match, Please Try again"});
    }
    //Checking the length of password
    if(password.length < 6){
        valErrors.push({msg: "Password should be more than 6 characters and alphanumeric"});
    }

    if(valErrors.length > 0){
        let data = {
            valErrors,
            fullname : (typeof fullname!=undefined ? fullname : ''),
            email : (typeof email!=undefined ? email : ''),
            password : (typeof password!=undefined ? password : ''),
            repassword : (typeof repassword!=undefined ? repassword : '')
        };
        res.render('userviews/registerUser', data);
    } else {
        User.findOne({ email: email}).then(user => {
            if(user){
                //user exists
                valErrors.push({msg: 'This user already exists.'});
                res.render('userviews/registerUser', {
                    valErrors,
                    fullname,
                    email
                });
            } else {
                //Creating the user in form of mongodb collection
                const newUser = new User ({
                    fullname,
                    email,
                    password
                });

                User.create(newUser, (error, user) => {
                    if (error) {
                        console.log(error);
                        const registrationErrors = Object.keys(error.errors).map(key => error.errors[key].message)
                    
                        res.render('userviews/registerUser', {
                            registrationErrors,
                            fullname,
                            email
                        });
                    }
                    req.flash('successMessage', "Awesome, Your account has been created!, Verify your email and Login now.");
                    //* Imp */send mail here and redirect to login
                    res.redirect('login');
                });
            }
        });
    }    
});


/*
.
.
.
.
.
======================User's Functionality after login===================
.
.
.
.
*/

router.get('/userpage', (req, res) => {
    res.render('userviews/userpage', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        title: "Users Profile",
        description : "This page will update the user details",
        keywords: "profile, language test portal"
    });
});

router.post('/userpage', (req, res) => {
    //have to write update code from here
    req.flash('errorMessage', 'Sorry, updation failed. Try again after sometime');
    res.redirect('/user/userpage');
});

router.get('/starttest', async(req, res) => {
    const lang = await languagesDB.find({});
    res.render('userviews/starttest', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        title: "Users Test Inititation",
        description : "This page will help the user in starting his test",
        keywords: "Start language test",
        lang
    });
});

router.get('/starttest/:langname', (req, res) => {
    const lang = req.params.langname;
    res.render('userviews/chooselevel', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        title: "Step 2 - Test Inititation",
        description : "This page will help the user in starting his test",
        keywords: "Choose language level",
        lang
    });
});

router.get('/starttest/:langname/level/:langlevel', (req, res) => {
    const lang = req.param.langname;
    const langlevel = req.params.langlevel;
    //console.log(langlevel);
})

module.exports = router;