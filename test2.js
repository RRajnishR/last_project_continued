require('dotenv').config();
require('./models/db');
const mongoose = require("mongoose");
const uResponse = require('./models/userResponse.model');

const Res = new uResponse({
    language : "Hindi",
    lang_level : 'A1',
    reading_section : [{
        reading_para_id : mongoose.Types.ObjectId("5caadd0fbd91fe0548d9026f"),
    }, {
        reading_para_id : mongoose.Types.ObjectId("5cb1058a0b03f03150847194"),
    }]
});


uResponse.create(Res, (error, res) => {
    console.log(error, res);
});