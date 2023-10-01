var express = require('express');
var router = express.Router();
const usercontroller = require('../controller/usercontroller')

router.get('/login',usercontroller.login)

router.post('/loginpost',usercontroller.loginpost)

router.get('/signup',usercontroller.signup)

router.get('/',usercontroller.home)

router.get('/products/:productId',usercontroller.productview)

router.get('/signupotp',usercontroller.otp)

router.post('/verify-otp',usercontroller.otppost)

router.get('/forgotpassword',usercontroller.forgotpassword)

router.post('/forgotPassword', usercontroller.forgotpasswordPost)

router.get('/otpverification', usercontroller.otpVerification)

router.post('/otpVerificationPost',usercontroller.otpVerificationPost)

router.get('/resetpassword',usercontroller.resetpass)

router.post('/resetpassword',usercontroller.resetPasswordPost)

router.post('/signup',usercontroller.signupPost)

router.post('/resendOTP', usercontroller.resendOTP);

// <-------cart---------->

router.get('/cart',usercontroller.cart)

module.exports = router;
