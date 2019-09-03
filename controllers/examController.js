const express = require('express');
const bcrypt = require('bcrypt');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const languages = require('../models/language.model');
const examiner = require('../models/examiner.model');
const readingSectionDB = require('../models/readingSection.model');
const listeningSectionDB = require('../models/listeningSection.model');
const writingSectionDB = require('../models/writingSection.model');
const speakingSectionDB = require('../models/speakingSection.model');
const examDB = require('../models/userResponse.model');
const checkAuthentication = require('../middlewares/examcreator_islogin.middleware');
const authoriseExaminer = require('../middlewares/ec_isAuthenticated.middleware');
const emailTransporter = require('../middlewares/sendmail.middleware');
/*

*/
router.get('/', checkAuthentication, async (req, res) => {
    const all_languages = await languages.find({});
    res.render("examcreatorviews/login", {
        all_languages,
        title: "Exam Creators Login and Registeration Page",
        description : "This page will help you in creating and Signing-in in your account",
        keywords: "Register/sign in your account for language test portal",
        valErrors : req.flash('valerrors'),
        fullname : req.flash('fullname'),
        email : req.flash('email'),
        regError : req.flash('registrationErrors'),
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage')
    });
});

/*

*/
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    // login examiner to the dashboard
    examiner.findOne({ email }, (error, user) => {
        if (user) {
          // compare passwords.
          bcrypt.compare(password, user.password, (error, same) => {
            if (same) {
              req.session.examinerid = user._id;
              req.session.expert_in_lang = user.expert_in_lang;
              res.redirect('/exam/dashboard')
            } else {
              req.flash('errorMessage', "Incorrect Password!");
              res.redirect('/exam');
            }
          })
        } else { 
            req.flash('errorMessage', "User Not Found");
            res.redirect('/exam');
        }
      })
});

/*

*/
router.post('/register', (req, res) => {
    //receive all data here---check if email exists---else save and send email
    const { fullname, email, password, repassword, expert_in_lang } = req.body;
    let valErrors = []; //Validation Errors

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
        req.flash('valerrors', valErrors);
        req.flash('fullname', fullname);
        req.flash('email', email);
        res.redirect('/exam#menu1');
    } else {
        examiner.findOne({ email: email}).then(user => {
          if(user){
              //user exists
              valErrors.push({msg: 'This user already exists.'});
              req.flash('valerrors', valErrors);
              req.flash('fullname', fullname);
              req.flash('email', email);
              res.redirect('/exam#menu1');
          } else {
              //Creating the user in form of mongodb collection
              const newUser = new examiner ({
                  fullname,
                  email,
                  password,
                  expert_in_lang
              });

              examiner.create(newUser, (error, user) => {
                  if (error) {
                      console.log(error);
                      const registrationErrors = Object.keys(error.errors).map(key => error.errors[key].message)

                      req.flash('fullname', fullname);
                      req.flash('email', email);
                      req.flash('registrationErrors', registrationErrors);
                      res.redirect('/exam#menu1');
                  }
                const url = req.protocol + "://" + req.headers.host;
                let html = '<!DOCTYPE html><html><head><title>TILPT EMAIL</title><link href="https://fonts.googleapis.com/css?family=Gugi|Roboto+Condensed" rel="stylesheet"><style type="text/css">body{margin:0px;padding:0px;background-color:}.container{margin:3em;padding:5em}h1{font-family:"Gugi",cursive;margin-bottom:-1.15em}.card-holder{margin:2em 0}.card{font-family:"Roboto Condensed",sans-serif;font-size:3em;font-weight:800;height:4em;width:64em;padding:0.5em 1em;border-radius:0.25em;display:table-cell;vertical-align:middle;letter-spacing:-2px;box-shadow:0 4px 8px 0 rgba(0,0,0,0.2)}.card .subtle{color:#000;font-size:0.5em;font-weight:400;letter-spacing:-1px}.card i{font-size:3em}.bg-gold{background:-webkit-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);background:-o-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);background:-moz-linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);background:linear-gradient(110deg, #fdcd3b 60%, #ffed4b 60%);box-sizing:border-box}.bg-gold:after{content:"";display:table;clear:both}p{font-size:0.6em;letter-spacing:2px}a.btn{border:1px solid black;color:black}.column{float:left;width:50%}.textpart{font-size:0.65em}span.small{font-size:0.6em;color:red;letter-spacing:1px !important}</style></head><body><div class="container"><h1> TILPT.COM</h1><div class="card-holder"><div class="card bg-gold"><div class="column textpart"> Hi, '+ user.fullname +'.<br/><br/> Welcome to tilpt.com,<br/> Your account has been created. To verify your email, Please <a href="'+url+'/exam/verify/'+user._id+'/'+user.secret_token+'">Click Here</a>.<br/> <span class="small">Else, copy the following link and paste it into your browser. <a href="'+url+'/exam/verify/'+user._id+'/'+user.secret_token+'">'+url+'/exam/verify/'+user._id+'/'+user.secret_token+'</a> </span> <br/> <br/> Thanks and Regards,<br/> TILPT Team.</div><div class="column"> <img align="right" src="http://www.langjobs.com/assets/india-min.png" alt="india"></div></div></div></div></body></html>';
                
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: user.email,
                    subject: 'TILPT Examiner Account Activation ',
                    html : html
                    };
                    
                    emailTransporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        req.flash('errorMessage', "Something went wrong, please try again later");
                    } else {
                        //console.log(info);
                        req.flash('successMessage', "Awesome, Your account has been created!, Verify your email and Login now.");
                    }
                    res.redirect('/exam');
                    });
              });
          }
      });
    }
});

router.get('/verify/:id/:secret', (req, res) => {
    const userid = req.params.id;
    const secret = req.params.secret;

    examiner.findById(userid, (err, user) => {
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
        res.redirect('/exam');
    })
});

/*
    Following Route Opens Dashboard
*/
router.get('/dashboard', authoriseExaminer, async(req, res) => {
    const readsec = await readingSectionDB.find({exam_creator : req.session.examinerid});
    const listensec = await listeningSectionDB.find({exam_creator : req.session.examinerid});
    const writesec = await writingSectionDB.find({exam_creator : req.session.examinerid});
    const speaksec = await speakingSectionDB.find({exam_creator : req.session.examinerid});
    res.render("examcreatorviews/dashboard", {
        title : "Exam Creators DashBoard",
        keywords: "exam, create, Questions",
        description : "Protected Dashboard for Exam Creators",
        language : req.session.expert_in_lang,
        readsec,
        listensec,
        writesec,
        speaksec
    });
});






/*
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               =================Reading Section Start=======================
                                                       *********
                               following route will open the page from where exam controller
                               can CRUD Reading Section Paragraphs and Questions.
                                                       *********
                               =============================================================
                               .
                               .
                               .
                               .
                               .
                               .
*/



function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}



router.get('/readingSection', authoriseExaminer, async(req, res) => {
    const reading_paragraphs = await readingSectionDB.find({});
    res.render("examcreatorviews/readview", {
        title : "Reading Section",
        keywords: "exam, create, Questions",
        description : "Creating Reading section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
        reading_paragraphs
    });
});
/*
    Following will render the view for adding a new paragraph
*/
router.get('/readingSection/addPara', authoriseExaminer, (req, res) => {
    res.render("examcreatorviews/addReadPara", {
        title : "Add Reading Section",
        keywords: "exam, create, Question",
        description : "Creating Reading section Questions here",
        expert_in_lang : req.session.expert_in_lang,
        language : req.session.expert_in_lang,
    });
});
/*
    following will retrieve the form data from add Paragraph Page and store it into the database
*/
router.post('/readingSection/addPara', authoriseExaminer, (req, res) => {
    //console.log(req.body);
    const { lang_level, paragraph } = req.body;
    const readingSection = new readingSectionDB({
        paragraph : paragraph,
        language  : req.session.expert_in_lang,
        exam_creator : req.session.examinerid,
        lang_level : lang_level
    });
    readingSectionDB.create(readingSection, (err, paragraphdata) => {
        if(err){
            //console.log(err);
            req.flash('errorMessage', "Some Problem Occured. Try again later!");
        } else {
            req.flash('successMessage', "Paragraph Added, Now add Questions related to it by clicking on + button corresponding to your paragraph");
        }
        res.redirect('/exam/readingSection');
    });
});

/*
    This will open up a page from where Examiner can update paragraph and level
*/
router.get('/readingSection/updatepara/:paragraphid', (req, res) => {
    const paragraphid = req.params.paragraphid;
    readingSectionDB.findById(paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Paragraph is not Available, Do not alter URL');
            res.redirect('/exam/readingSection');
        } else {
            res.render("examcreatorviews/updateReadPara", {
                title : "Update paragraph",
                keywords: "exam, create, Questions",
                description : "Creating Reading section Questions here",
                expert_in_lang : req.session.expert_in_lang,
                language : req.session.expert_in_lang,
                para
            });
        }
    });
});

router.post('/readingSection/updatepara/', (req, res) => {
    const { paragraphid, lang_level, paragraph} = req.body;
    readingSectionDB.findOneAndUpdate({_id:paragraphid}, {paragraph : paragraph, lang_level : lang_level}, (err, doc) => {
        if(err){
            req.flash('errorMessage', 'Something went wrong, try again later!');
        } else {
            req.flash('successMessage', 'Paragraph updated successfully');
        }
        //console.log(doc);
        res.redirect('/exam/readingSection/');
    })
});

/*
    This will open up a page from where Examiner can insert questions in correspondance to paragraph
*/
router.get('/readingSection/insertques/:paragraphid', authoriseExaminer, async(req, res) => {
    const paragraph = readingSectionDB.findById(req.params.paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Paragraph is not Available, Do not alter URL');
            res.redirect('/exam/readingSection');
        } else {
            res.render("examcreatorviews/addReadQuestion", {
                title : "Add Question to paragraph",
                keywords: "exam, create, Questions",
                description : "Creating Reading section Questions here",
                successMessage : req.flash('successMessage'),
                errorMessage : req.flash('errorMessage'),
                expert_in_lang : req.session.expert_in_lang,
                language : req.session.expert_in_lang,
                para
            });
        }
    });
});

router.post('/readingSection/insertques', authoriseExaminer, (req, res) => {
    const {question, paragraphid, qtype, option1, option2, option3, option4, correct_index} = req.body;

    let readingQuestions = ""; 
    if(qtype == 'optional'){
        readingQuestions = {
            question,
            qtype,
            option1, 
            option2, 
            option3, 
            option4,
            correct_index
        }
    } else {
        readingQuestions = {
            question,
            qtype
        }
    }
    readingSectionDB.findOne({_id : paragraphid}, (err, section) => {
        if(err){
            console.log("Error while searching..",err);
        } else {
            section.questions.push(readingQuestions);
            section.save(err => {
                if(err){
                    console.log(err);
                } else {
                    console.log("Saved");
                }
            }); 
            res.redirect('/exam/readingSection/insertques/'+paragraphid);
        }
    })
});

/*
    Following route will delete the paragraph stored in database using paragraphid
*/
router.get('/readingSection/delpara/:paragraphid', authoriseExaminer, (req, res) => {
    const paragraphid = req.params.paragraphid;
    readingSectionDB.findByIdAndDelete(paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Some error occured while deleting the paragraph, Try again later');
        } else {
            req.flash('successMessage', 'Paragraph is deleted successfully');
        }
        res.redirect('/exam/readingSection');
    });
})

/*
    Following route will delete the question stored in along paragraph
*/
router.get('/readingSection/para/:paragraphid/delques/:quesid', authoriseExaminer, (req,res) =>{
    const paragraphid = req.params.paragraphid;
    const quesid = req.params.quesid;

    readingSectionDB.findOne({_id:paragraphid}, (err, section) => {
        if(err){
            req.flash('errorMessage', 'Some error Occured');
        } else {
            section.questions.id(quesid).remove();
            section.save();
            req.flash('successMessage', 'Question Deleted Successfully');
        }
        res.redirect('/exam/readingSection/insertques/'+paragraphid);
    });
});
// ******************Reading Section Ended*************************

/*
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               =================Listening Section Start=======================
                                                       *********
                               following route will open the page from where exam controller
                               can CRUD Listening Questions.
                                                       *********
                               ===============================================================
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
*/
router.get('/listeningSection', authoriseExaminer, async(req, res) => {
    const listendata = await listeningSectionDB.find({});
    res.render("examcreatorviews/listenSection/listenview", {
        title : "Listening Section",
        keywords: "exam, create, Questions",
        description : "Creating Listening section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
        listendata
    });
});
// Get router to show the page
router.get('/listenSection/addMedia', authoriseExaminer, (req, res) => {
    res.render("examcreatorviews/listenSection/addmedia", {
        title: "Add Media From Here",
        keywords: "exam, create, Questions",
        description : "Creating Listening section Questions here",
        language : req.session.expert_in_lang,
        errorMessage : req.flash('errorMessage')
    });
});

//post router to save the media
router.post('/listenSection/addMedia', authoriseExaminer, (req, res) => {
    const { media } = req.files;
    const { title, document_type, lang_level} = req.body;
    
    var allowed_mimetype = ["video/mp4", "video/ogg", "video/webm", "audio/ogg", "audio/mpeg", "audio/wav", "audio/mp3"];
    if(!allowed_mimetype.includes(media.mimetype)){
        req.flash('errorMessage', 'Only Video(Mp4, Ogg, webm Formats) and Audio(Mp3, wav, ogg Formats) allowed');
        return res.redirect('/exam/listenSection/addMedia');
    }

    //Needs more segregation as Program should know that if it is a video then allow only video files and similar for audio

    if(media.size > 31457280){
        req.flash('errorMessage', 'Size of Media can not be larger than 30 MB');
        return res.redirect('/exam/listenSection/addMedia');
    }

    let uploadPath; 
    const pathname = makeid(3)+"_"+media.name;
    if(document_type == "video"){
        uploadPath = path.resolve(__dirname, '..', 'public/all_media/video', pathname);
    } else {
        uploadPath = path.resolve(__dirname, '..', 'public/all_media/audio', pathname);
    }
    
    media.mv(uploadPath, (error) => {
        if(error) {
            req.flash('errorMessage', 'Something went wrong while uploading the media');
            res.redirect('/exam/listeningSection');
        }
        listeningSectionDB.create({
            title,
            document_type,
            lang_level,
            path_of_file : (document_type=='video' ? '/all_media/video/' : '/all_media/audio/')+pathname,
            mimetype : media.mimetype,
            language : req.session.expert_in_lang,
            exam_creator : req.session.examinerid
        }, (err, post) =>{
            if(err){
                req.flash('errorMessage', 'Something went wrong while saving details into database');
            } else {
                req.flash('successMessage', 'Awesome, your media file was uploaded, Now add questions for it');
            }
            res.redirect('/exam/listeningSection');
        });
    });
});
/*
    Deletes Media from Listening Section.
*/
router.get('/listeningSection/delQues/:id', authoriseExaminer, (req, res) => {
    const paragraphid = req.params.id;
    listeningSectionDB.findByIdAndDelete(paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Some error occured while deleting the media, Try again later');
        } 
        //console.log(para);
        fs.unlink(para.path_of_file, ()=>{
            req.flash('successMessage', 'Media deleted successfully');
        });
        res.redirect('/exam/listeningSection');
    });
});

router.get('/listeningSection/addQues/:id', authoriseExaminer, async(req, res) => {
    const listenId = req.params.id;
    const listenpart = listeningSectionDB.findById({_id: listenId}, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Could not find the media details, try again later');
            res.redirect('/exam/listeningSection');
        } else {
            res.render("examcreatorviews/listenSection/addQues", {
                title: "Add Media Questions From Here",
                keywords: "exam, create, Questions",
                description : "Creating Listening section Questions here",
                language : req.session.expert_in_lang,
                expert_in_lang : req.session.expert_in_lang,
                errorMessage : req.flash('errorMessage'),
                successMessage : req.flash('successMessage'),
                para
            });
        }
    })
});
//Inserting Questions in corresponding to the Media 
router.post('/listeningSection/insertques', authoriseExaminer,  (req, res) => {
    const {question, paragraphid, qtype, option1, option2, option3, option4, correct_index} = req.body;

    let listeningQuestions = ""; 
    if(qtype == 'optional'){
        listeningQuestions = {
            question,
            qtype,
            option1, 
            option2, 
            option3, 
            option4,
            correct_index
        }
    } else {
        listeningQuestions = {
            question,
            qtype
        }
    }
    listeningSectionDB.findOne({_id : paragraphid}, (err, section) => {
        if(err){
            console.log("Error while searching..", err);
            req.flash('errorMessage', 'Some error occured while updating');
        } else {
            section.questions.push(listeningQuestions);
            section.save(err => {
                if(err){
                    req.flash('errorMessage', 'Some error occured while updating into the database')
                } else {
                    req.flash('successMessage', 'Question Added!');
                }
            }); 
            res.redirect('/exam/listeningSection/addQues/'+paragraphid);
        }
    })
});

router.get('/listeningSection/para/:paragraphid/delques/:quesid', authoriseExaminer, (req,res) =>{
    const paragraphid = req.params.paragraphid;
    const quesid = req.params.quesid;

    listeningSectionDB.findOne({_id:paragraphid}, (err, section) => {
        if(err){
            req.flash('errorMessage', 'Some error Occured');
        } else {
            section.questions.id(quesid).remove();
            section.save();
            req.flash('successMessage', 'Question Deleted Successfully');
        }
        res.redirect('/exam/listeningSection/addQues/'+paragraphid);
    });
});

// ******************Listening Section Ended*************************

/*
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               =================Writing Section Starts=======================
                                                       *********
                               following route will open the page from where exam controller
                               can CRUD writing Questions.
                                                       *********
                               ==============================================================
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
*/
router.get('/writingSection', authoriseExaminer, async(req, res) => {
    const writing = await writingSectionDB.find({});
    res.render("examcreatorviews/writingSection/writingview", {
        title : "Manage writing Section",
        keywords: "exam, create, Questions",
        description : "Creating writing section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
        writing
    });
});

//Following opens up a page from where examiner can add topics
router.get('/writingSection/addTopic/', authoriseExaminer, (req, res) =>{
    res.render("examcreatorviews/writingSection/addTopic", {
        title : "Add Topics for writing Section",
        keywords: "exam, create, Questions",
        description : "Creating writing section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang
    });
});

//following route save the data from the above page to DB
router.post('/writingSection/addTopic/', authoriseExaminer, (req, res) => {
    const { lang_level, topic } = req.body;
    if(topic=="" || topic==null){
        req.flash('errorMessage', 'Topic Can not be empty');
        return res.redirect('/exam/writingSection/');
    }
    writingSectionDB.create({
        topic,
        lang_level,
        language : req.session.expert_in_lang,
        exam_creator : req.session.examinerid,
    }, (err, topic) => {
        if(err){
            req.flash('errorMessage', 'Something went wrong while saving details into database');
        } else {
            req.flash('successMessage', 'Awesome, your Topic was uploaded');
        }
        res.redirect('/exam/writingSection');
    });
});

//Following route will open up a page from where you can edit the content of Topic
router.get('/writingSection/updatepara/:id', authoriseExaminer, (req, res) => {
    const paragraphid = req.params.id;
    writingSectionDB.findById(paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Topic is not Available, Do not alter URL');
            return res.redirect('/exam/writingSection');
        } else {
            res.render("examcreatorviews/writingSection/editTopic", {
                title : "Edit Topics for writing Section",
                keywords: "exam, create, Questions",
                description : "Creating writing section Questions here",
                successMessage : req.flash('successMessage'),
                errorMessage : req.flash('errorMessage'),
                language : req.session.expert_in_lang,
                para
            });
        }
    });
});

//Following route update the topic details in DB
router.post('/writingSection/updatepara/', authoriseExaminer, (req, res) => {
    const { paragraphid, lang_level, topic} = req.body;
    writingSectionDB.findOneAndUpdate({_id:paragraphid}, {topic : topic, lang_level : lang_level}, (err, doc) => {
        if(err){
            req.flash('errorMessage', 'Something went wrong, try again later!');
        } else {
            req.flash('successMessage', 'Topic updated successfully');
        }
        res.redirect('/exam/writingSection/');
    })
});

//following route deletes topic 
router.get('/writingSection/delpara/:id', authoriseExaminer, (req, res) => {
    const paragraphid = req.params.id;
    writingSectionDB.findByIdAndDelete(paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Some error occured while deleting the topic, Try again later');
        } else {
            req.flash('successMessage', 'Topic deleted successfully');
        }
        res.redirect('/exam/writingSection');
    });
});
// ******************Writing Section Ended*************************

/*
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               =================Speaking Section Starts=======================
                                                       *********
                               following route will open the page from where exam controller
                               can CRUD speaking Questions.
                                                       *********
                               ================================================================
                               .
                               .
                               .
                               .
                               .
                               .
                               .
                               .
*/
router.get('/speakingSection', authoriseExaminer, async(req, res) => {
    const speakingdocs = await speakingSectionDB.find({});
    res.render("examcreatorviews/speakingSection/speakview", {
        title : "Manage Question Set for speaking Section",
        keywords: "exam, create, Questions",
        description : "Creating speaking section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
        speakingdocs
    });
});

router.get('/speakingSection/addQues/', authoriseExaminer, (req, res) => {
    res.render("examcreatorviews/speakingSection/addQues", {
        title : "Add Topics for speaking Section",
        keywords: "exam, create, Questions",
        description : "Creating speaking section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
    });
});

router.post('/speakingSection/addQues/', authoriseExaminer, (req, res) => {
    const { lang_level, directed_interview_ques, interaction_ques, point_of_view_ques } = req.body;
    speakingSectionDB.create({
        directed_interview_ques,
        interaction_ques,
        point_of_view_ques,
        lang_level,
        language : req.session.expert_in_lang,
        exam_creator : req.session.examinerid
    }, (err, doc) => {
        if(err){
            req.flash('errorMessage', 'Something went wrong while saving data, try again later');
            return res.redirect('/exam/speakingSection/addQues');
        } 
        req.flash('successMessage', 'New Question set was uploaded successfully');
        res.redirect('/exam/speakingSection/'); 
    });
});

router.get('/speakingSection/delQues/:id', authoriseExaminer, (req, res) => {
    const paragraphid = req.params.id;
    speakingSectionDB.findByIdAndDelete(paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Some error occured while deleting the topic, Try again later');
        } else {
            req.flash('successMessage', 'Question set deleted successfully');
        }
        res.redirect('/exam/speakingSection');
    });
});

router.get("/results", authoriseExaminer, async(req, res) => {
    const exams = await examDB.find({language : req.session.expert_in_lang, exam_status: "Completed"});
    res.render("examcreatorviews/results", {
        title : "Exam Completed By Users",
        keywords: "exam, Assess, Check Exam",
        description : "Examiner can check unchecked exampapers from here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
        examinerid : req.session.examinerid,
        exams
    });
});

router.get("/checkpaper/:examid", authoriseExaminer, async(req, res) => {
    const examid = req.params.examid;
    const exam = await examDB.findById(examid);

    let readingids = [exam.reading_section[0].readin_para_id, exam.reading_section[1].readin_para_id];
    let writingids = [exam.writing_section[0].writing_topic_id, exam.writing_section[1].writing_topic_id];
    let listeningids = [exam.listening_section[0].listening_media_id, exam.listening_section[1].listening_media_id, exam.listening_section[2].listening_media_id];
    let speakingid = exam.speaking_section.speaking_ques_id;

    const listendocs = await listeningSectionDB.find({'_id': { $in: listeningids}});
    const readingdocs = await readingSectionDB.find({'_id': { $in: readingids}});
    const writingdocs = await writingSectionDB.find({'_id': { $in: writingids}});
    const speakingdoc = await speakingSectionDB.findById(speakingid);

    // for(let i=0; i<listendocs.length; i++){
    //     let indexinexamtable = exam.listening_section.findIndex((obj => obj.listening_media_id == listendocs[i]._id));
    //     let questions = listendocs.questions;
    //     for(let j=0; j<questions.length; j++){
    //         let indexinarray = questions.findIndex((obj => obj._id == questions[j]._id));
    //         questions[i].response = exam.listening_section[indexinexamtable].user_response[indexinarray]
    //     }
    // }

    res.render("examcreatorviews/checkpaper", {
        title : "Exam Completed By Users",
        keywords: "exam, Assess, Check Exam",
        description : "Examiner can check unchecked exampapers from here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
        language : req.session.expert_in_lang,
        examinerid : req.session.examinerid,
        exam,
        listendocs,
        readingdocs,
        writingdocs,
        speakingdoc
    });
});

module.exports = router;