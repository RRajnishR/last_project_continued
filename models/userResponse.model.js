const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Users',
        required : true 
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
    exam_date : {
        type: Date,
        default: new Date()
    },
    rs_start_time : {
        type: Date
    },
    reading_section_ques_1 : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'readingSectionParagraphs',
        required : true
    },
    read_responses_1 : [{
        question_id : String,
        response : String
    }],
    reading_section_ques_2 : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'readingSectionParagraphs',
        required : true
    },
    read_responses_2 : [{
        question_id : String,
        response : String
    }],
    listening_quest_1 : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'ListeningSectionSchema',
        required : true
    },
    listening_response_1 : {
        question_id : String,
        response : String
    },
    listening_quest_2 : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'ListeningSectionSchema',
        required : true
    },
    listening_response_2 : {
        question_id : String,
        response : String
    },
    listening_quest_3 : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'ListeningSectionSchema',
        required : true
    },
    listening_response_3 : {
        question_id : String,
        response : String
    },
    writing_ques_1 : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'ListeningSectionSchema',
        required : true
    },
    writing_response_1 : {

    },
    
});