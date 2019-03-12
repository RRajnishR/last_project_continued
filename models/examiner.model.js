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

    }, 
    email : {

    }, 
    password : {

    }, 
    expert_in_lang : {

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

const User = mongoose.model('Users', userSchema);

module.exports = User;