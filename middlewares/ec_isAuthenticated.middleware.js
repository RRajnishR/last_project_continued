    
const examcreator = require('../models/examiner.model')

module.exports = (req, res, next) => {
    // fetch user from database
    examcreator.findById(req.session.examinerid, (error, user) => {
      if (error || !user) {
        req.flash('errorMessage', "You are not authorized to view this content, Please Login")
        return res.redirect('/exam')
      }
  
      next()
    })
    // verify user
    // if user is valid, permit request.
    // else redirect.
  }