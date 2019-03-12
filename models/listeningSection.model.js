const mongoose = require('mongoose');

const ListeningSectionSchema = new mongoose.Schema({
    title : {
        type : String,
        required : [true, 'Please Give this Document a Title']
    },
    document_type : {
        type : String,
        required : [true, 'Need the']
    },
    path_of_file :{
        type : String,
        required : [true, 'Error while Uploading']
    },
    language : {
        type : String,
        required : true
    },
    questions : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'readQuestions'        
    }],
    uploader : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'examcreator'
    },
    createdAt : {
        type : Date,
        default : new Date()
    }
});

const ListeningQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, 'Need a question']
    },
    question_type : {
        type : String,
        enum : ['optional', 'subjective'],
        required : [true, 'Question Type is Mandatory']
    },
    options : [{
        type : String
    }],
    correct_option : {
        type : Number
    }
});