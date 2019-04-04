const mongoose = require('mongoose');

const readingSectionQuestions = new mongoose.Schema({
    paragraph_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'readingSectionParagraphs',
        required : true
    }, 
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

const rSectionQuestions = mongoose.model('readingSectionQuestions', readingSectionQuestions);

module.exports = rSectionQuestions;