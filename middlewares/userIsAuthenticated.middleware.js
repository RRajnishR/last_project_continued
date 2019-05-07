    
const user = require('../models/users.model')

module.exports = (req, res, next) => {
    // fetch user from database
    user.findById(req.session.userid, (error, user) => {
      if (error || !user) {
        req.flash('errorMessage', "You are not authorized to view this content, Please Login")
        return res.redirect('/user/login');
      }
  
      next()
    })
    // verify user
    // if user is valid, permit request.
    // else redirect.
  }