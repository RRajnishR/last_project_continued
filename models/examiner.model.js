const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


function generateSecretKey() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

const examinerSchema = new mongoose.Schema({
    fullname : {
        type : String,
        required : [true, 'What should we call you?']
    }, 
    email : {
        type : String,
        required : [true, 'We need to recognise you uniquely, so please fill up your email']
    }, 
    password : {
        type : String,
        required : [true, 'Without Password, How will be able to login?']
    }, 
    expert_in_lang : {
        type : String
    },
    secret_token : {
        type : String
    },
    profile_status : {
        type : Boolean,
        default : true
    },
    register_date : {
        type : Date,
        default : Date.now()
    }
}, {versionKey: false});

examinerSchema.pre('save', function(next) {
    const thisuser = this

    bcrypt.hash(thisuser.password, 10, function (error, encrypted) {
        thisuser.password = encrypted;
        thisuser.secret_token = generateSecretKey();
        next();
    });
});

const examCreator = mongoose.model('examcreator', examinerSchema);

module.exports = examCreator;