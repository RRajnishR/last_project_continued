module.exports = (req, res, next) =>{
    if(req.session.adminId){
        return res.redirect('/admin/dashboard');
    } 
    next();
}

