const mongoose = require('mongoose');

const writingSectionSchema = new mongoose.Schema({
    topic : {
        type : String,
        required : [true, 'Topic is required!']
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

const wSection = mongoose.model('writingSchema', writingSectionSchema);
module.exports = wSection;