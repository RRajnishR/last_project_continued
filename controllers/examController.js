const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const languages = require('../models/language.model');
const examiner = require('../models/examiner.model');
router.get('/', async (req, res) => {
    const all_languages = await languages.find({});
    res.render("examcreatorviews/login", {
        all_languages,
        title: "Exam Creators Login and Registeration Page",
        description : "This page will help you in creating and Signing-in in your account",
        keywords: "Register/sign in your account for language test portal",
        valErrors : req.flash('valerrors'),
        fullname : req.flash('fullname'),
        email : req.flash('email'),
        regError : req.flash('registrationErrors'),
        successMessage : req.flash('successMessage')
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    // login examiner to the dashboard
    examiner.findOne({ email }, (error, user) => {
        if (user) {
          // compare passwords.
          bcrypt.compare(password, user.password, (error, same) => {
            if (same) {
              res.redirect('/')
            } else {
              res.redirect('/auth/login')
            }
          })
        } else { 
          return res.redirect('/auth/login')
        }
      })
});

router.post('/register', (req, res) => {
    //receive all data here---check if email exists---else save and send email
    const { fullname, email, password, repassword, expert_in_lang } = req.body;
    let valErrors = []; //Validation Errors

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
        req.flash('valerrors', valErrors);
        req.flash('fullname', fullname);
        req.flash('email', email);
        res.redirect('/exam#menu1');
    } else {
        examiner.findOne({ email: email}).then(user => {
          if(user){
              //user exists
              valErrors.push({msg: 'This user already exists.'});
              req.flash('valerrors', valErrors);
              req.flash('fullname', fullname);
              req.flash('email', email);
              res.redirect('/exam#menu1');
          } else {
              //Creating the user in form of mongodb collection
              const newUser = new examiner ({
                  fullname,
                  email,
                  password,
                  expert_in_lang
              });

              examiner.create(newUser, (error, user) => {
                  if (error) {
                      console.log(error);
                      const registrationErrors = Object.keys(error.errors).map(key => error.errors[key].message)

                      req.flash('fullname', fullname);
                      req.flash('email', email);
                      req.flash('registrationErrors', registrationErrors);
                      res.redirect('/exam#menu1');
                  }
                  req.flash('successMessage', "Awesome, Your account has been created!, Verify your email and Login now.");
                  //* Imp */send mail here and redirect to login
                  res.redirect('/exam');
              });
          }
      });
    }
});

module.exports = router;