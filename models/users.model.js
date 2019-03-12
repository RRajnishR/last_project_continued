const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

function generateSecretKey() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

const userSchema = new mongoose.Schema({
    fullname : {
        type : String,
        required : [true, 'Please provide your Full Name']
    },
    email : {
        type : String,
        required : [true, 'Please provide your email.']
    },
    password : {
        type : String,
        required : [true, 'Please provide your password.']
    },
    profile_image : {
        type : String
    },
    register_date:{
        type : Date,
        default : Date.now
    },
    mail_verified:{
        type : Boolean,
        default : false
    },
    secret_token:{
        type : String,
    },
    profile_status:{
        type : Boolean,
        default : true
    }
}, {versionKey: false});

userSchema.pre('save', function(next) {
    const thisuser = this

    bcrypt.hash(thisuser.password, 10, function (error, encrypted) {
        thisuser.password = encrypted;
        thisuser.secret_token = generateSecretKey();
        next();
    });
});

const User = mongoose.model('Users', userSchema);

module.exports = User;