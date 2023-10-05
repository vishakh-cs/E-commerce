var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const usercontroller = require('../controller/usercontroller')



// multer 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads';

        // Check if the directory exists, and create it if it doesn't
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Set the destination to the upload directory
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    },
});

const upload = multer({ storage: storage });

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
router.get('/cart/:userid',usercontroller.cart)

router.post('/cart/add/:productId', usercontroller.addToCart);

router.post('/cart/remove/:productId',usercontroller.remove)

router.get('/profile',usercontroller.profile)

router.post('/profile/upload', upload.single('profileImage'), usercontroller.profilepost);

router.post('/profile/addAddress', usercontroller.addAddresspost);

router.get('/addnewaddress',usercontroller.addnewaddress)



module.exports = router;
