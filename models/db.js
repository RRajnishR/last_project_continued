//DB Configuration from config folder.
const db = require('../config/key').MongoURI;
const mongoose = require('mongoose');

mongoose.connect(db, { useNewUrlParser:true })
.then(() => console.log('mongodb connected'))
.catch(err => console.log('x----Error---x', err));

