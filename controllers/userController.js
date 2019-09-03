const express = require('express');
const bcrypt = require('bcrypt');
var router = express.Router();
const path = require('path');
const User = require('../models/users.model'); 
const languagesDB = require('../models/language.model');
const readingSectionDB = require('../models/readingSection.model');
const listeningSectionDB = require('../models/listeningSection.model');
const writingSectionDB = require('../models/writingSection.model');
const speakingSectionDB = require('../models/speakingSection.model');
const userExamDB = require('../models/userResponse.model');
const emailTransporter = require('../middlewares/sendmail.middleware');
const isLogin = require('../middlewares/userIsLogin.middleware');
const isAuthenticated = require('../middlewares/userIsAuthenticated.middleware');

//Generate random name.
function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

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
                    console.log(error);
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
    User.findById(id, (err, user) => {
        if(err){
            //This returned error
            res.render("userviews/changepass",{
                success: req.flash('successMessage'),
                error : req.flash('errorMessage'),
                flag : 1,
                title: "Reset your password",
                description : "This page will help the user in resetting their password",
                keywords: "Reset Password, password retreival page"
            }); 
        }
        if(user){
            //Token Matched
            if(token == user.secret_token){
                //Time expired
                if(Date.now() > time){
                    res.render("userviews/changepass",{
                        success: req.flash('successMessage'),
                        error : req.flash('errorMessage'),
                        flag : 2,
                        title: "Reset your password",
                        description : "This page will help the user in resetting their password",
                        keywords: "Reset Password, password retreival page"
                    });
                }else{
                    //still in time
                    res.render("userviews/changepass",{
                        success: req.flash('successMessage'),
                        error : req.flash('errorMessage'),
                        id,
                        flag : 4,
                        title: "Reset your password",
                        description : "This page will help the user in resetting their password",
                        keywords: "Reset Password, password retreival page"
                    });
                }
            } else {
                //Token Unmatched
                res.render("userviews/changepass",{
                    success: req.flash('successMessage'),
                    error : req.flash('errorMessage'),
                    flag : 3,
                    title: "Reset your password",
                    description : "This page will help the user in resetting their password",
                    keywords: "Reset Password, password retreival page"
                });
            }
        }
    });
});

function generateSecretKey() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

router.post('/forgotpassword/reset', (req, res) => {
    const { id, password } = req.body;
    bcrypt.hash(password, 10, function (error, encrypted) {
        if(error){
            req.flash('errorMessage', "Something went wrong while creating new password");
            res.redirect('/user/login');
        }
        User.findOneAndUpdate({_id: id}, {password : encrypted, secret_token : generateSecretKey()}, (err, user) => {
            if(err){
                req.flash('errorMessage', "Something went wrong while updating your new password");
                res.redirect('/user/login');
            }
            req.flash('successMessage', "Awesome, you've created your new password. Login Now.");
            res.redirect('/user/login');
        });
    });
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
        keywords: "profile, language test portal",
        success: req.flash('successMessage'),
        error : req.flash('errorMessage')
    });
});

router.post('/userpage', (req, res) => {
    const { profile_image } = req.files;
    var allowed_mimetype = ["image/png", "image/jpeg"];
    if(!allowed_mimetype.includes(profile_image.mimetype)){
        req.flash('errorMessage', 'Only *.jpg & *.png images are allowed.');
        return res.redirect('/user/userpage');
    }

    if(profile_image.size > 2097152){
        req.flash('errorMessage', 'Size of image can not be larger than 2 MB');
        return res.redirect('/user/userpage');
    }
 
    const pathname = makeid(3)+"_"+profile_image.name;
    let uploadPath = path.resolve(__dirname, '..', 'public/all_media/photos', pathname);
    profile_image.mv(uploadPath, (err) => {
        if(err){
            req.flash('errorMessage', 'Something went wrong while uploading the media');
            return res.redirect('/user/userpage');
        } 

        User.findById(req.session.userid, (error, thisuser) => {
            if(err){
                req.flash('errorMessage', 'Something went wrong while updating the database');
                return res.redirect('/user/userpage');
            }
            thisuser.profile_image = "/all_media/photos/"+pathname;
            thisuser.save(err => {
                req.session.dp = "/all_media/photos/"+pathname;
                req.flash('successMessage', 'New Profile picture uploaded successfully!');
                res.redirect('/user/userpage');
            });
        });
    });
});

router.get('/starttest', isAuthenticated, async(req, res) => {
    const lang = await languagesDB.find({});
    res.render('userviews/starttest', {
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        success: req.flash('successMessage'),
        error : req.flash('errorMessage'),
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

router.get('/starttest/:langname/level/:langlevel', isAuthenticated,  async(req, res) => {
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


    const newExam = new userExamDB({
        user_id : req.session.userid,
        language : langname,
        lang_level : (level == "na" ? "GEN" : level),
        reading_section : [
            { reading_para_id : reading_section_ques_1[0]._id }, 
            { reading_para_id : reading_section_ques_2[0]._id },
        ],
        writing_section : [
            {writing_topic_id : writing_ques_1[0]._id},
            {writing_topic_id : writing_ques_2[0]._id} 
        ],
        listening_section : [
            {listening_media_id : listening_quest_1[0]._id},
            {listening_media_id : listening_quest_2[0]._id},
            {listening_media_id : listening_quest_3[0]._id},
        ],
        speaking_section : {
            speaking_ques_id : speaking_ques_1[0]._id
        }
    })

    userExamDB.create(newExam, (error, exam) => {
        if(error){
            req.flash('errorMessage', 'Sorry, something went wrong while creating a new exam for you. Please come back later');
            return res.redirect('/user/starttest/'+langname);
        } 
        res.redirect('/user/disclaimer/'+exam._id);
    });   
    
});

router.get('/disclaimer/:examid', (req, res) => {
    const examid = req.params.examid;
    res.render("userviews/showdisclaimer",{
        title: "Exam Disclaimer Page",
        description : "This page will give disclaimer and information about the exam",
        keywords: "Exam Notification, Disclaimer etc.",
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        examid : examid
    });
});

router.get('/exam/listen/:examid', (req, res) => {
    const examid = req.params.examid;
    res.render("userviews/listendisclaimer", {
        title: "Listening Section Start",
        description : "Exam has started",
        keywords: "Listening Section, Exam, Language, Interpretation",
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        examid : examid
    });
});

//Listening Exam Start from here 
router.get('/exam/listening/start/:examid/t/:starttime', isAuthenticated, async(req, res) => {
    const examid = req.params.examid;
    const examtime = req.params.starttime;
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while creating a new exam for you. Please come back later');
            return res.redirect('/user/starttest/');
        }
        //console.log(exam);
        let listeningids = [exam.listening_section[0].listening_media_id, exam.listening_section[1].listening_media_id, exam.listening_section[2].listening_media_id];
        
        listeningSectionDB.find({
            '_id': { $in: listeningids}
        }, function(err, docs){
             //console.log(docs);
             res.render("userviews/listenexampage", {
                title: "Listening Section Start",
                description : "Exam has started",
                keywords: "Listening Section, Exam, Language, Interpretation",
                userid : req.session.userid,
                fullname : req.session.fullname,
                dp : req.session.dp,
                email : req.session.email,
                language : exam.language,
                lang_level : exam.lang_level,
                examid:exam._id,
                examtime, 
                docs
            });
        });

        
    })
});

router.post("/exam/listening/save/:examid/:quesid", (req, res) => {
    const examid = req.params.examid;
    const quesid = req.params.quesid;
    req.body = JSON.parse(JSON.stringify(req.body));
    //Using the for loop to take the name & value of form element seperately and pushing them in respective userresponse 
    const userresponse = [];
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          userresponse.push({
            listen_ques_id : key,
            response : req.body[key]
          })
        }
    }
    
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            return "failed";
        }
        objIndex = exam.listening_section.findIndex(( obj => obj.listening_media_id == quesid));
        //console.log(quesid, objIndex);
        exam.listening_section[objIndex].user_response = [...userresponse];
        exam.save(err => {
            if(err){
                res.json({"status": "failed", error: err})
            } else {
                res.json({"status": "success"})
            }
        })
    });
    
});

//Writing Section Starts
router.get("/exam/write/:examid", (req, res) => {
    const examid = req.params.examid;
    res.render("userviews/writingdisclaimer", {
        title: "Writing Section Start",
        description : "Exam part 2",
        keywords: "Writing Section, Exam, Language, Interpretation",
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        examid : examid
    });
});

router.get('/exam/writing/start/:examid/t/:starttime', isAuthenticated, async(req, res) => {
    const examid = req.params.examid;
    const examtime = req.params.starttime;
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while creating a new exam for you. Please come back later');
            return res.redirect('/user/starttest/');
        }
        let writingids = [exam.writing_section[0].writing_topic_id, exam.writing_section[1].writing_topic_id];
        
        writingSectionDB.find({
            '_id': { $in: writingids}
        }, function(err, docs){
             res.render("userviews/writingexampage", {
                title: "Writing Section Start",
                description : "Second Part has started",
                keywords: "Writing Section, Exam, Language, Interpretation",
                userid : req.session.userid,
                fullname : req.session.fullname,
                dp : req.session.dp,
                email : req.session.email,
                language : exam.language,
                lang_level : exam.lang_level,
                examid:exam._id,
                examtime, 
                docs
            });
        }); 
    })
});

router.post("/exam/writing/save/:examid/:quesid", (req, res) => {
    const examid = req.params.examid;
    const quesid = req.params.quesid;
    const response = req.body.response;
    
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            return "failed";
        }
        objIndex = exam.writing_section.findIndex(( obj => obj.writing_topic_id == quesid));
        //console.log(quesid, objIndex);
        exam.writing_section[objIndex].user_answer = response;
        exam.save(err => {
            if(err){
                res.json({"status": "failed", error: err})
            } else {
                res.json({"status": "success"})
            }
        })
    });
    
});

//Reading Section Starts
router.get("/exam/read/:examid", (req, res) => {
    const examid = req.params.examid;
    res.render("userviews/readdisclaimer", {
        title: "Reading Section Start",
        description : "Exam part 3",
        keywords: "Reading Section, Exam, Language, Interpretation",
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        examid : examid
    });
});

router.get('/exam/reading/start/:examid/t/:starttime', isAuthenticated, async(req, res) => {
    const examid = req.params.examid;
    const examtime = req.params.starttime;
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while creating a new exam for you. Please come back later');
            return res.redirect('/user/starttest/');
        }
        //console.log(exam);
        let readingids = [exam.reading_section[0].reading_para_id, exam.reading_section[1].reading_para_id];
        
        readingSectionDB.find({
            '_id': { $in: readingids}
        }, function(err, docs){
             //console.log(docs);
             res.render("userviews/readexampage", {
                title: "Listening Section Start",
                description : "Exam has started",
                keywords: "Listening Section, Exam, Language, Interpretation",
                userid : req.session.userid,
                fullname : req.session.fullname,
                dp : req.session.dp,
                email : req.session.email,
                language : exam.language,
                lang_level : exam.lang_level,
                examid:exam._id,
                examtime, 
                docs
            });
        });

        
    })
});

router.post("/exam/reading/save/:examid/:quesid", (req, res) => {
    const examid = req.params.examid;
    const quesid = req.params.quesid;
    req.body = JSON.parse(JSON.stringify(req.body));
    //Using the for loop to take the name & value of form element seperately and pushing them in respective userresponse 
    const userresponse = [];
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          userresponse.push({
            listen_ques_id : key,
            response : req.body[key]
          })
        }
    }
    
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            return "failed";
        }
        objIndex = exam.reading_section.findIndex(( obj => obj.reading_para_id == quesid));
        //console.log(quesid, objIndex);
        exam.reading_section[objIndex].user_response = [...userresponse];
        exam.save(err => {
            if(err){
                res.json({"status": "failed", error: err})
            } else {
                res.json({"status": "success"})
            }
        })
    });
    
});


router.get("/exam/speak/:examid", (req, res) => {
    const examid = req.params.examid;
    res.render("userviews/speakdisclaimer", {
        title: "Speaking Section Start",
        description : "Exam part 4",
        keywords: "Speaking Section, Exam, Language, Interpretation",
        userid : req.session.userid,
        fullname : req.session.fullname,
        dp : req.session.dp,
        email : req.session.email,
        examid : examid
    });
});

router.get('/exam/speaking/start/:examid/t/:starttime', isAuthenticated, async(req, res) => {
    const examid = req.params.examid;
    const examtime = req.params.starttime;
    userExamDB.findById(examid, (err, exam) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while creating a new exam for you. Please come back later');
            return res.redirect('/user/starttest/');
        }
        //console.log(exam);
        let speakingid = exam.speaking_section.speaking_ques_id;
        
        speakingSectionDB.findById(speakingid, function(err, doc){
             //console.log(docs);
             res.render("userviews/speakexampage", {
                title: "Listening Section Start",
                description : "Exam has started",
                keywords: "Listening Section, Exam, Language, Interpretation",
                userid : req.session.userid,
                fullname : req.session.fullname,
                dp : req.session.dp,
                email : req.session.email,
                language : exam.language,
                lang_level : exam.lang_level,
                examid:exam._id,
                examtime, 
                doc
            });
        });

        
    })
});


router.post("/exam/speaking/upload/:examid/:qtype", (req, res) => {
    const { audiovideo } = req.files;
    const examid = req.params.examid;
    const qtype = req.params.qtype;
    //console.log(audiovideo);
    const filename = makeid(8)+".webm";
    let uploadPath = path.resolve(__dirname, '..', 'public/all_media/speakingsectionexam', filename);

    audiovideo.mv(uploadPath, (error) => {
        if(error){
            //console.log(error);
            return res.json({"report": "failed", "err": "failed while uploading"});
        }
        userExamDB.findById(examid, (err, exam) => {
            if(err){
                return res.json({"report": "failed", "err": "failed while searching in db"});
            }
            //**important: add code to check if there is any other value present, if yes unlink the file first.
            if(qtype == 1){
                exam.speaking_section.directed_interview_res = '/all_media/speakingsectionexam/'+filename;
            } else if(qtype == 2) {
                exam.speaking_section.interaction_ques_res = '/all_media/speakingsectionexam/'+filename;
            } else if(qtype == 3){
                exam.speaking_section.pov_res = '/all_media/speakingsectionexam/'+filename;
            }
            exam.save(err2 => {
                if(err2){
                    return res.json({"report": "failed", "err": "failed while saving in db"});
                }
                res.json({"report": "success"});
            });
        });
    });
});

router.get("/exam/stop/:examid", isAuthenticated, (req, res) => {
    userExamDB.findById(req.params.examid, (err, exam) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while exiting from exam for you. Although you can logout now.');
            return res.redirect('/user/starttest/');
        }
        exam.exam_status = "Cancelled";
        exam.save(error => {
            if(error){
                req.flash('errorMessage', 'Sorry, something went wrong while cancelling exam for you. Although you can logout now.');
                return res.redirect('/user/starttest/');
            } 
            req.flash('successMessage', 'We cancelled this exam for you. We recommend you start exam only when you are certain to complete it.');
            return res.redirect('/user/starttest/');
        });
    });
});

router.get("/exam/finish/:examid", isAuthenticated, (req, res) => {
    userExamDB.findById(req.params.examid, (err, exam) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while finding and completing exam for you. Although you can logout now.');
            return res.redirect('/user/starttest/');
        }
        exam.exam_status = "Completed";
        exam.exam_end_time = new Date();
        exam.save(error => {
            if(error){
                req.flash('errorMessage', 'Sorry, something went wrong while completing exam for you. Although you can logout now.');
                return res.redirect('/user/starttest/');
            } 
            req.flash('successMessage', 'Awesome, you have completed the text. Results will be notifies to you soon.');
            return res.redirect('/user/results');
        });
    });
});

router.get("/results", isAuthenticated, (req, res) => {
    userExamDB.find({user_id: req.session.userid}, (err, docs) => {
        if(err){
            req.flash('errorMessage', 'Sorry, something went wrong while fetching results from DataBase');
            return res.redirect('/user/starttest/');
        }
        res.render("userviews/results",{
            success: req.flash('successMessage'),
            error : req.flash('errorMessage'),
            title: "Language Exam Results",
            description : "This page will list the results of exams",
            keywords: "Exam, result, language exams",
            docs
        });
    });
});

module.exports = router;