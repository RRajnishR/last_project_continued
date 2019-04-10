const mongoose = require('mongoose');

const ListeningQuestions = new mongoose.Schema({
    question : {
        type : String,
        required : true
    }, 
    qtype : {
        type : String,
        enum : ['optional', 'singleliner', 'multipleliner']
    },
    option1 : {
        type : String
    },
    option2 : {
        type : String
    },
    option3 : {
        type : String
    },
    option4 : {
        type : String
    },
    correct_index : {
        type : Number
    }
});

const ListeningSectionSchema = new mongoose.Schema({
    title : {
        type : String,
        required : [true, 'Please Give this Document a Title']
    },
    document_type : {
        type : String,
        required : [true, 'Tell me about the type of file']
    },
    path_of_file :{
        type : String,
        required : [true, 'Error while Uploading']
    },
    language : {
        type : String,
        required : true
    },
    lang_level : {
        type : String,
        enum : ['A1', 'A2', 'B1', 'B2'],
        default : 'A1'
    },
    questions : [ListeningQuestions],
    uploader : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'examcreator'
    },
    createdAt : {
        type : Date,
        default : new Date()
    }
});

const lSection = mongoose.model('listeningSchema', ListeningSectionSchema);
module.exports = lSection;