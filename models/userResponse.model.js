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
        enum : ['A1', 'A2', 'B1', 'B2', 'GEN'],
        default : 'GEN'
    },
    exam_start_time : {
        type: Date,
        default: new Date()
    },
    reading_section : [new mongoose.Schema({
        reading_para_id : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'readingSectionParagraphs'
        }, 
        user_response : [{
            reading_ques_id : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'readingSectionParagraphs.questions'
            },
            response : String
        }]
    }, {_id: false})],
    writing_section : [new mongoose.Schema({
        writing_topic_id : {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'writingSchemas'
        },
        user_answer : {
            type : String,
            default: ""
        }
    }, {_id: false})],
    listening_section : [new mongoose.Schema({
        listening_media_id : {
            type:mongoose.Schema.Types.ObjectId,
            ref : 'listeningschemas'
        },
        user_response : [{
            listen_ques_id : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'listeningschemas.questions'
            },
            response : String
        }]
    }, {_id: false})],
    speaking_section : new mongoose.Schema({
        speaking_ques_id : {
            type:mongoose.Schema.Types.ObjectId,
            ref : 'speakingschemas'
        },
        //Path to Video/Audio
        directed_interview_res : {
            type : String,
            default:"NA"
        },
        interaction_ques_res : {
            type : String,
            default:"NA"
        },
        pov_res : {
            type : String,
            default:"NA"
        }
    }, {_id: false}),
    exam_status : {
        type : String,
        enum : ["Completed", "Incomplete", "Cancelled"],
        default : "Incomplete"
    },
    exam_end_time : {
        type : Date
    },
    marks_obtained : {
        type : Number,
        default : 0
    },
    check_status : {
        type : Boolean, 
        default : false
    },
    checked_by : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'examcreators',
    }
});

const responseSection = mongoose.model('userResponse', responseSchema);
module.exports = responseSection;