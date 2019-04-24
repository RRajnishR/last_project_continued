require('dotenv').config();
require('./models/db');
const expressEdge = require("express-edge");
const express = require('express');
const path = require('path');
const edge = require("edge.js");
// const cloudinary = require('cloudinary');
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const connectFlash = require('connect-flash');
const expressSession = require('express-session');
//this is helping us in persisting session even after app restarts
const connectMongo = require("connect-mongo");
const PORT = process.env.PORT || 8888;


const userController = require('./controllers/userController');
const examController = require('./controllers/examController');
const adminController = require('./controllers/adminController');
const logOutController = require('./controllers/logoutController');

var app = new express();
//Flash messages
app.use(connectFlash());
const mongoStore = connectMongo(expressSession);

//Telling express to treat this public folder as static file repository
app.use(express.static(path.join(__dirname, 'public')));
//Using bodyparser included in express itself, this will help in recieving post variables
app.use(express.urlencoded({extended:false}));
//Express file upload
app.use(fileUpload());
app.use(expressEdge);
app.set("views", path.join(__dirname, 'views'));


app.use(
    expressSession({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: new mongoStore({
            mongooseConnection: mongoose.connection
        })
    })
);

app.all('/', (req, res) => {
    res.render('home', {
        'title' : 'Indian Languages Certification',
        'description' : 'We certify your level of knowledge in Indian Languages',
        'keywords' : 'Indian, languages, certifications, hindi, bengali'
    })
});

app.use('/user', userController);
app.use('/exam', examController);
app.use('/admin', adminController);
app.get('/logout', logOutController);
//Redirect For 404 Errors
app.use(function (req, res, next) {
    res.status(404).sendFile(path.join(__dirname+'/public/404.html'));
});

app.listen(PORT, console.log(`http://localhost:${PORT}`));

