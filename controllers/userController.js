const express = require('express');
const bcrypt = require('bcrypt');
var router = express.Router();
const User = require('../models/users.model'); 
const languagesDB = require('../models/language.model');
const readingSectionDB = require('../models/readingSection.model');
const listeningSectionDB = require('../models/listeningSection.model');
const writingSectionDB = require('../models/writingSection.model');
const speakingSectionDB = require('../models/speakingSection.model');
const emailTransporter = require('../middlewares/sendmail.middleware');
const isLogin = require('../middlewares/userIsLogin.middleware');
const isAuthenticated = require('../middlewares/userIsAuthenticated.middleware');

router.get('/login', isLogin, (req, res) => {
    res.render("userviews/loginUser",{
        success: req.flash('successMessage'),
        error : req.flash('errorMessage'),
        title: "Users Login Page",
        description : "This page will log-in the user",
        keywords: "Login into language test portal"
    });
});

router.post('/login', (req, res) => {
    const { email, password} = req.body;
    User.findOne({ email }, (error, user) => {
        if (user) {
          // compare passwords.
          bcrypt.compare(password, user.password, (error, same) => {
            if (same) {
              req.session.userid = user._id;
              req.session.fullname = user.fullname;
              req.session.dp = user.profile_image;
              req.session.email = user.email;
              res.redirect('/user/userpage');
            } else {
              req.flash('errorMessage', "Incorrect Password!");
              res.redirect('/user/login');
            }
          });
        } else { 
            req.flash('errorMessage', "User Not Found");
            res.redirect('/user/login');
        }
      })
});

router.get('/forgotpassword', isLogin, (req, res) => {
    res.render("userviews/forgotPass",{
        success: req.flash('successMessage'),
        error : req.flash('errorMessage'),
        title: "Users Login Page",
        description : "This page will log-in the user",
        keywords: "Login into language test portal"
    });
});

router.post('/forgotpassword', (req, res) =>{
    const { email } = req.body;
    User.findOne({ email }, (err, user) => {
        if(user){
            const url = req.protocol + "://" + req.headers.host;
            let expiretime = Date.now()+7200000;
            let total_url = url+"/user/forgotpassword/"+user.id+"/"+user.secret_token+"/"+expiretime;
            let html = '<!DOCTYPE html><html><head> <title>TILPT EMAIL</title> <link href="https://fonts.googleapis.com/css?family=Gugi|Roboto+Condensed" rel="stylesheet"> <style type="text/css"> body{margin: 0px; padding: 0px; background-color:}.container{margin: 3em; padding: 5em}h1{font-family: "Gugi", cursive; margin-bottom: -1.15em}.card-holder{margin: 2em 0}.card{font-family: "Roboto Condensed", sans-serif; font-size: 3em; font-weight: 800; height: 4em; width: 64em; padding: 0.5em 1em; border-radius: 0.25em; display: table-cell; vertical-align: middle; letter-spacing: -2px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2)}.card .subtle{color: #000; font-size: 0.5em; font-weight: 400; letter-spacing: -1px}.card i{font-size: 3em}.bg-gold{background: -webkit-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%); background: -o-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%); background: -moz-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%); background: linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%); box-sizing: border-box}.bg-gold:after{content: ""; display: table; clear: both}p{font-size: 0.6em; letter-spacing: 2px}a.btn{border: 1px solid black; color: black}.column{float: left; width: 50%}.textpart{font-size: 0.65em}span.small{font-size: 0.6em; color: red; letter-spacing: 1px !important}</style></head><body> <div class="container"> <h1>Forgot Password | TILPT.COM</h1> <div class="card-holder"> <div class="card bg-gold"> <div class="column textpart"> Hi, '+ user.fullname +'. <br/> <br/> Hi, we heard you forgot your password, <br/> Use following link to reset your password. This link will expire after 2 hours. <br/> <br/> <span class="small"> <a href="'+total_url+'">'+total_url+'</a> <br/> copy and paste the link in your address bar, incase you are unable to click on it. </span> <br/> <br/> If you have not requested for change in your password, drop us a mail at: theilpt@gmail.com <br/> Thanks and Regards, <br/> TILPT Team.</div><div class="column"> <img align="right" src="http://www.langjobs.com/assets/india-min.png" alt="india"></div></div></div></div></body></html>';
            var mailOptions = {
                from: process.env.EMAIL,
                to: user.email,
                subject: 'TILPT Password Recovery',
                html : html
              };
              
              emailTransporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    req.flash('errorMessage', "Sorry, Can not send email right now, please come back later.");
                    return res.redirect('/user/forgotpassword');
                } else {
                    req.flash('successMessage', "An email with link to reset your password has been sent to your mail. It will be valid for 2 hours only.");
                    res.redirect('/user/forgotpassword');
                }
              });
        } else {
            req.flash('errorMessage', "uh, oh. It seems like this email is not registered with us. Try another.");
            res.redirect('/user/forgotpassword');
        }
        if(err){
            req.flash('errorMessage', "Something went wrong, Please come back later!");
            res.redirect('/user/forgotpassword'); 
        }
    })
});

router.get('/forgotpassword/:id/:token/:time', (req, res) => {
    const {id, token, time} = req.params;
    res.send(id+" "+token+" "+time);
});


router.get('/register', isLogin, (req, res) => {
    res.render("userviews/registerUser",{
        title: "User Registeration Page",
        description : "This page will help you in creating your account",
        keywords: "Register your account for language test portal"
    });
});

router.post('/register', (req, res) => {
    //destructuring here
    const { fullname, email, password, repassword,  } = req.body;
    let valErrors = [];

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
        let data = {
            valErrors,
            fullname : (typeof fullname!=undefined ? fullname : ''),
            email : (typeof email!=undefined ? email : ''),
            password : (typeof password!=undefined ? password : ''),
            repassword : (typeof repassword!=undefined ? repassword : '')
        };
        res.render('userviews/registerUser', data);
    } else {
        User.findOne({ email: email}).then(user => {
            if(user){
                //user exists
                valErrors.push({msg: 'This user already exists.'});
                res.render('userviews/registerUser', {
                    valErrors,
                    fullname,
                    email
                });
            } else {
                //Creating the user in form of mongodb collection
                const newUser = new User ({
                    fullname,
                    email,
                    password
                });

                User.create(newUser, (error, user) => {
                    if (error) {
                        console.log(error);
                        const registrationErrors = Object.keys(error.errors).map(key => error.errors[key].message)
                    
                        res.render('userviews/registerUser', {
                            registrationErrors,
                            fullname,
                            email
                        });
                    }
                    const url = req.protocol + "://" + req.headers.host;
                    let html = '<!DOCTYPE html><html><head><title>TILPT EMAIL</title><link href="https://fonts.googleapis.com/css?family=Gugi|Roboto+Condensed" rel="stylesheet"><style type="text/css">body{margin:0px;padding:0px;background-color:}.container{margin:3em;padding:5em}h1{font-family:"Gugi",cursive;margin-bottom:-1.15em}.card-holder{margin:2em 0}.card{font-family:"Roboto Condensed",sans-serif;font-size:3em;font-weight:800;height:4em;width:64em;padding:0.5em 1em;border-radius:0.25em;display:table-cell;vertical-align:middle;letter-spacing:-2px;box-shadow:0 4px 8px 0 rgba(0,0,0,0.2)}.card .subtle{color:#000;font-size:0.5em;font-weight:400;letter-spacing:-1px}.card i{font-size:3em}.bg-gold{background:-webkit-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);background:-o-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);background:-moz-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);background:linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);box-sizing:border-box}.bg-gold:after{content:"";display:table;clear:both}p{font-size:0.6em;letter-spacing:2px}a.btn{border:1px solid black;color:black}.column{float:left;width:50%}.textpart{font-size:0.65em}span.small{font-size:0.6em;color:red;letter-spacing:1px !important}</style></head><body><div class="container"><h1> TILPT.COM</h1><div class="card-holder"><div class="card bg-gold"><div class="column textpart"> Hi, '+ user.fullname +'.<br/><br/> Welcome to tilpt.com,<br/> Your account has been created. To verify your email, Please <a href="'+url+'/user/verify/'+user._id+'/'+user.secret_token+'">Click Here</a>.<br/> <span class="small">Else, copy the following link and paste it into your browser. <a href="'+url+'/user/verify/'+user._id+'/'+user.secret_token+'">'+url+'/user/verify/'+user._id+'/'+user.secret_token+'</a> </span> <br/> <br/> Thanks and Regards,<br/> TILPT Team.</div><div class="column"> <img align="right" src="http://www.langjobs.com/assets/india-min.png" alt="india"></div></div></div></div></body></html>';
                    
                    var mailOptions = {
                        from: process.env.EMAIL,
                        to: user.email,
                        subject: 'TILPT Account Activation ',
                        html : html
                      };
                      
                      emailTransporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            req.flash('errorMessage', "Something went wrong, please try again later");
                            return res.redirect('/user/register');
                        } else {
                            //console.log(info);
                            req.flash('successMessage', "Awesome, Your account has been created!, Verify your email and Login now.");
                            res.redirect('/user/login');
                        }
                      });
                });
            }
        });
    }    
});

router.get('/verify/:id/:secret', (req, res) => {

    const userid = req.params.id;
    const secret = req.params.secret;

    User.findById(userid, (err, user) => {
        if(err){
            req.flash('errorMessage', 'Sorry something went wrong. Try again later!');
        } 
        if(user.mail_verified){
            req.flash('errorMessage', 'Mail already Verified');
        } else {
            if(secret == user.secret_token){
                user.mail_verified = true;
                user.save(err => {
                    if(err){
                        req.flash('errorMessage', 'Sorry something went wrong. Try again later!');
                    } else {
                        req.flash('successMessage', 'Awesome, account verified. Now Login!');
                    }
                })
            } else {
                req.flash('errorMessage', 'Sorry, Problem with link, contact admin!');
            }
        }
        res.redirect('/user/login');
    })

});

/*
.
.
.
.
.
======================User's Functionality after login===================
.
.
.
.
*/

router.get('/userpage', isAuthenticated, (req, res) => {
    res.render('userviews/userpage', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        title: "Users Profile",
        description : "This page will update the user details",
        keywords: "profile, language test portal"
    });
});

router.post('/userpage', (req, res) => {
    //have to write update code from here
    req.flash('errorMessage', 'Sorry, updation failed. Try again after sometime');
    res.redirect('/user/userpage');
});

router.get('/starttest', isAuthenticated, async(req, res) => {
    const lang = await languagesDB.find({});
    res.render('userviews/starttest', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        title: "Users Test Inititation",
        description : "This page will help the user in starting his test",
        keywords: "Start language test",
        lang
    });
});

router.get('/starttest/:langname', isAuthenticated, (req, res) => {
    const lang = req.params.langname;
    res.render('userviews/chooselevel', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        title: "Step 2 - Test Inititation",
        description : "This page will help the user in starting his test",
        keywords: "Choose language level",
        error: req.flash('errorMessage'),
        lang
    });
});

router.get('/starttest/:langname/level/:langlevel',  async(req, res) => {
    //Randomly select 2 paragraphs from reading section
    //Use https://stackoverflow.com/a/24808585/2823275 to add "match" keywords for language level

    const langname = req.params.langname;
    const level = req.params.langlevel;
    var query;
    if(level == "na") {
        query = {
            language : langname
        };
    } else {
        query = {
            language : langname, 
            lang_level : level
        };
    }

    let reading_section_ques_1 = await readingSectionDB.aggregate([
        {$match : query},
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });
    
    let reading_section_ques_2 = await readingSectionDB.aggregate([
        {$match : 
            {
                $and : [
                    query,
                    { _id: { $nin: [reading_section_ques_1[0]._id] } }
                ]
            }
        },
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });
    
    let listening_quest_1 = await listeningSectionDB.aggregate([
        {$match : query},
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });
    
    let listening_quest_2 = await listeningSectionDB.aggregate([
        {$match : 
            {
                $and : [
                    query,
                    { _id: { $nin: [listening_quest_1[0]._id] } }
                ]
            }
        },
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });

    let listening_quest_3 = await listeningSectionDB.aggregate([
        {$match : 
            {
                $and : [
                    query,
                    { _id: { $nin: [listening_quest_1[0]._id, listening_quest_2[0]._id] } }
                ]
            }
        },
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });
    
    let writing_ques_1 = await writingSectionDB.aggregate([
        {$match : query},
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });

    let writing_ques_2 = await writingSectionDB.aggregate([
        {$match : 
            {
                $and : [
                    query,
                    { _id: { $nin: [listening_quest_1[0]._id] } }
                ]
            }
        },
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });

    let speaking_ques_1 = await speakingSectionDB.aggregate([
        {$match : query},
        {$sample : {size : 1}}
    ],  (err, data) => {
        if(err){
            req.flash('errorMessage', 'Something went wront while retrieving Questions');
            return res.redirect('/user/starttest/'+langname);
        } 
        return data[0];
    });

    res.render("userviews/showdisclaimer",{
        title: "Exam Disclaimer Page",
        description : "This page will give disclaimer and information about the exam",
        keywords: "Exam Notification, Disclaimer etc.",
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email
    });    
    
});

router.get('/exam', (req, res) => {
    res.render("userviews/exampage", {
        title: "Exam Page",
        description : "Exam has started",
        keywords: "Exam, Language, Interpretation"
    });
});

module.exports = router;