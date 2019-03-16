const express = require('express');
var router = express.Router();
const User = require('../models/users.model'); 

router.get('/login', (req, res) => {
    res.render("userviews/loginUser",{
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


module.exports = router;