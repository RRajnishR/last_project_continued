module.exports = (req, res, next) =>{
    if(req.session.examinerid){
        return res.redirect('/exam/dashboard');
    } 
    next();
}