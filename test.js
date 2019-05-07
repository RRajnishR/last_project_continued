require('dotenv').config();
const emailTransporter = require('./middlewares/sendmail.middleware');

var mailOptions = {
    from: process.env.EMAIL,
    to: 'moodi.rajnish@gmail.com',
    subject: 'Node mailer Test 1',
    text: `Hahahahahaha
            It was successful!`
  };
  
  emailTransporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });