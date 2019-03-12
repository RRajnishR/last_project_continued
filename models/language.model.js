const mongoose = require('mongoose');

const langSchema = new mongoose.Schema({
    lang_name : {
        type : String,
        required : true
    },
    lang_code : {
        type : String, 
        required : true
    }
}, {versionKey: false});

const Language = mongoose.model('languages', langSchema);

module.exports = Language;