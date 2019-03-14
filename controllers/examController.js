const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const languages = require('../models/language.model');

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



module.exports = router;