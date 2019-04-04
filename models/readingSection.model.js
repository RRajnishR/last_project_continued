const mongoose = require('mongoose');

const readingSectionQuestions = new mongoose.Schema({
    Question : {
        type : String,
        required : true
    }, 
    qtype : {
        type : String,
        enum : ['optional', 'singleliner', 'multipleliner']
    },
    options : [{
        type : String
    }],
    correct_index : {
        type : Number
    }
});


const readingSection = new mongoose.Schema({
    paragraph: {
        type : String,
        required : [true, 'Woah! How can one answer without reading the paragraph first']
    },
    language : {
        type : String,
        required : [true, 'Language will be used to cater the student with their specific language needs']
    },
    exam_creator : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'examcreators',
        required : true
    },
    upload_date : {
        type: Date,
        default: new Date()
    },
    lang_level : {
        type : String,
        enum : ['A1', 'A2', 'B1', 'B2'],
        default : 'A1'
    }, 
    questions : [readingSectionQuestions]
});

const rSection = mongoose.model('readingSectionParagraphs', readingSection);

module.exports = rSection;