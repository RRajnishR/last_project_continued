const mongoose = require('mongoose');

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
    questions : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'readingSectionQuestions'
    }]
});

const rSection = mongoose.model('readingSectionParagraphs', readingSection);

module.exports = rSection;