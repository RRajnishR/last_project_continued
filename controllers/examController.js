const express = require('express');
const bcrypt = require('bcrypt');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const languages = require('../models/language.model');
const examiner = require('../models/examiner.model');
const readingSectionDB = require('../models/readingSection.model');
const listeningSectionDB = require('../models/listeningSection.model')
const checkAuthentication = require('../middlewares/examcreator_islogin.middleware');
const authoriseExaminer = require('../middlewares/ec_isAuthenticated.middleware');

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
            res.redirect('/exam')
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
                  req.flash('successMessage', "Awesome, Your account has been created!, Verify your email and Login now.");
                  //* Imp */send mail here and redirect to login
                  res.redirect('/exam');
              });
          }
      });
    }
});

/*
    Following Route Opens Dashboard
*/
router.get('/dashboard', authoriseExaminer, (req, res) => {
    res.render("examcreatorviews/dashboard", {
        title : "Exam Creators DashBoard",
        keywords: "exam, create, Questions",
        description : "Protected Dashboard for Exam Creators",
        language : req.session.expert_in_lang,
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
router.post('/readingSection/addPara', (req, res) => {
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
        console.log(doc);
        res.redirect('/exam/readingSection/');
    })
});

/*
    This will open up a page from where Examiner can insert questions in correspondance to paragraph
*/
router.get('/readingSection/insertques/:paragraphid', async(req, res) => {
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

router.post('/readingSection/insertques', (req, res) => {
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
router.get('/readingSection/delpara/:paragraphid', (req, res) => {
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
router.get('/readingSection/para/:paragraphid/delques/:quesid', (req,res) =>{
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
router.get('/listeningSection', async(req, res) => {
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
router.get('/listenSection/addMedia', (req, res) => {
    res.render("examcreatorviews/listenSection/addmedia", {
        title: "Add Media From Here",
        keywords: "exam, create, Questions",
        description : "Creating Listening section Questions here",
        language : req.session.expert_in_lang,
        errorMessage : req.flash('errorMessage')
    });
});

//post router to save the media
router.post('/listenSection/addMedia', (req, res) => {
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
router.get('/listeningSection/delQues/:id', (req, res) => {
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

router.get('/listeningSection/addQues/:id', async(req, res) => {
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
                para
            });
        }
    })
});
/*

*/
router.get('/writingSection', (req, res) => {
    res.render("examcreator/writingview", {
        title : "writing Section",
        keywords: "exam, create, Questions",
        description : "Creating writing section Questions here"
    });
});

/*

*/
router.get('/speakingSection', (req, res) => {
    res.render("examcreator/speakview", {
        title : "Speaking Section",
        keywords: "exam, create, Questions",
        description : "Creating Speaking section Questions here"
    });
});


module.exports = router;