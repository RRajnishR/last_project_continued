const express = require('express');
const mongoose = require('mongoose');
var router = express.Router();
const checkAuthentication = require('../middlewares/admin.middleware');

const Language = require('../models/language.model');

router.get('/', (req, res) => {
    res.redirect('/admin/login');
});
/*
    Request type : GET, will bring forth the login Page
*/
router.get('/login', checkAuthentication, (req, res) => {
    res.render("adminviews/login",{
        title: "Administrator's Login Page",
        description : "This page will log-in the admin to their dashboard",
        keywords: "login, language, dashboard, control"
    });
});
/*
    Request Type : POST, will check username and password
    if it matches login. Credentials are stored in dotenv file
*/
router.post('/login', (req, res) => {
    //console.log(req.body);
    const { login_id, password } = req.body;
    
    if(process.env.ADMIN_ID === login_id){
        if(process.env.ADMIN_PWD === password){
            req.session.adminId = login_id;
            res.redirect('/admin/dashboard');
        } else {
            res.render("adminviews/login",{
                        error : "Error in Login, Try different Credentials",
                        title: "Administrator's Login Page",
                        description : "This page will log-in the admin to their dashboard",
                        keywords: "login, language, dashboard, control"
                    });
        }
    } else {
        res.render("adminviews/login",{
                    error : "Username incorrect, Try different Credentials",
                    title: "Administrator's Login Page",
                    description : "This page will log-in the admin to their dashboard",
                    keywords: "login, language, dashboard, control"
                });
    }
});
/*
    This route will open up the dashboard. have to add a middleware to check if the session of admin 
    exists or not
*/
router.get('/dashboard', (req, res) => {
    res.render("adminviews/dashboard", {
        title: "Administrator's DashBoard",
        description : "This page will the admin to control the system",
        keywords: "Control, online test portal, India Languages"
    });
});
/*
  This route will take you to the Examiners page, from here admin can see all the examiners and control them.  
*/
router.get('/examiners', (req, res) => {
    res.render("adminviews/examinerlist", {
        title: "All Languages",
        description : "This page will let the admin create different languages",
        keywords: "Control, online test portal, India Languages"
    });
});
/*
  This route will take you to the Language page, from here admin can see all the languages and 
  CRUD Them.  
*/
router.get('/languages', async (req, res) => {

    const all_languages = await Language.find({});
    //console.log(req.flash('success'), req.flash('error'));
    res.render("adminviews/langlist", {
        all_languages,
        title: "All Languages",
        description : "This page will let the admin create different languages",
        keywords: "Control, online test portal, India Languages",
        error: req.flash('errors'),
        success : req.flash('success')
    });
});
/*
  This route is to save the language, which is sent from Languge page.  
*/
router.post('/languages', (req, res) => {
    Language.create(req.body, (error, lang) =>{
        if(error){
            req.flash('error', 'Error occured while saving data. Try again');
        } else {
            req.flash('success', 'Language added successfully');
        }
        res.redirect('languages');
    });
});
/*
  This route will help in deleting the language which is not needed or created in wrong manner  
*/
router.get('/langdelete/:id', (req, res) => {
    let language_id = req.params.id;
    Language.findByIdAndDelete(language_id, (err, lang) => {
        if(err){
            req.flash('error', 'Something went wrong while deleting this language, Try again');
        } else {
            req.flash('success', 'Language deleted successfully');
        }
        res.redirect('/admin/language');
    });
});

module.exports = router;