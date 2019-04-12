const mongoose = require('mongoose');

const speakingSectionSchema = new mongoose.Schema({
    directed_interview_ques : {
        type : String,
        required : true
    },
    interaction_ques : {
        type : String,
        required : true
    },
    point_of_view_ques : {
        type : String,
        required : true
    },
    lang_level : {
        type : String,
        enum : ['A1', 'A2', 'B1', 'B2'],
        default : 'A1'
    },
    language : {
        type : String,
        required : true
    },
    exam_creator : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'examcreator'
    },
    upload_date : {
        type : Date,
        default : new Date()
    }
});

const sSection = mongoose.model('speakingSchema', speakingSectionSchema);
module.exports = sSection;