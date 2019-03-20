const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const languages = require('../models/language.model');
const examiner = require('../models/examiner.model');
router.get('/', async (req, res) => {
    const all_languages = await languages.find({});
    //console.log(all_languages);
    res.render("examcreatorviews/login", {
        all_languages,
        title: "Exam Creators Login and Registeration Page",
        description : "This page will help you in creating and Signing-in in your account",
        keywords: "Register/sign in your account for language test portal"
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
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
});

module.exports = router;