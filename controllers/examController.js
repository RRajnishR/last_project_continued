const express = require('express');
const bcrypt = require('bcrypt');
var router = express.Router();
const mongoose = require('mongoose');
const languages = require('../models/language.model');
const examiner = require('../models/examiner.model');
const readingSectionDB = require('../models/readingSection.model');
//const readingQuestions = require('../models/readingQuestions.model');
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
        description : "Protected Dashboard for Exam Creators"
    });
});

/*
    =================Reading Section Start=======================
    following route will open the page from where exam controller
    can CRUD Reading Section Paragraphs and Questions.
*/
router.get('/readingSection', authoriseExaminer, async(req, res) => {
    const reading_paragraphs = await readingSectionDB.find({});
    res.render("examcreatorviews/readview", {
        title : "Reading Section",
        keywords: "exam, create, Questions",
        description : "Creating Reading section Questions here",
        successMessage : req.flash('successMessage'),
        errorMessage : req.flash('errorMessage'),
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
            console.log(err);
            req.flash('errorMessage', "Some Problem Occured. Try again later!");
        } else {
            req.flash('successMessage', "Paragraph Added, Now add Questions related to it by clicking on + button corresponding to your paragraph");
        }
        res.redirect('/exam/readingSection');
    });
});

/*
    This will open up a page from where Examiner can insert questions in correspondance to paragraph
*/
router.get('/readingSection/insertques/:paragraphid', async(req, res) => {
    const paragraph = readingSectionDB.findById(req.params.paragraphid, (err, para) => {
        if(err){
            req.flash('errorMessage', 'Corresponding Paragraph is not Available, Do not alter URL');
            res.redirect('/exam/readingSection');
        } else {
            res.render("examcreatorviews/addReadQuestion", {
                title : "Add Question to paragraph",
                keywords: "exam, create, Questions",
                description : "Creating Reading section Questions here",
                successMessage : req.flash('successMessage'),
                errorMessage : req.flash('errorMessage'),
                expert_in_lang : req.session.expert_in_lang,
                para
            });
        }
    });
});

router.post('/readingSection/insertques', (req, res) => {
    console.log(req.body);
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

*/
router.get('/listeningSection', (req, res) => {
    res.render("examcreator/listenview", {
        title : "Listening Section",
        keywords: "exam, create, Questions",
        description : "Creating Listening section Questions here"
    });
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