const mongoose = require('mongoose');
require('./models/db');
const Language = require('./models/language.model');

Language.create({
    lang_name : "Hindi",
    lang_code : "Hi"
}, (error, lang)=>{
    console.log(error, lang);
})