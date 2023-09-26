var express = require('express');
var router = express.Router();
const usercontroller = require('../controller/usercontroller')

router.get('/login',usercontroller.login)

router.get('/signup',usercontroller.signup)

router.get('/home',usercontroller.home)

router.get('/productview',usercontroller.productview)

router.get('/signupotp',usercontroller.otp)

router.post('/verify-otp',usercontroller.otppost)

router.get('/forgotpassword',usercontroller.forgotpassword)

router.post('/signup',usercontroller.signupPost)

module.exports = router;
