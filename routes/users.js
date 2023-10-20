var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const usercontroller = require('../controller/usercontroller')

const wishlistController = require('../controller/wishlistcontroller')
// const userAuthMiddleware = require('../Middleware/userAuth')
const isLoggedAuth = require('../Middleware/isLogged')



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
router.get('/cart/:userid',usercontroller.cart);

router.post('/cart/add/:productId', usercontroller.addToCart);

router.post('/cart/remove/:productId',usercontroller.remove);

router.post('/cartinc/add/:productId',usercontroller.incrementQuantity);

router.get('/profile',usercontroller.profile);

router.post('/profile/upload', upload.single('profileImage'), usercontroller.profilepost);

router.post('/profile/addAddress', usercontroller.addAddresspost);

router.get('/addnewaddress',usercontroller.addnewaddress);

router.post('/profile/deleteAddress/:addressId',usercontroller.deleteAddressPost)

router.get('/checkout',usercontroller.checkout)

router.post('/api/setPrimaryAddress/:id', usercontroller.setPrimaryAddress);

router.get('/ordersuccess',usercontroller.orderSuccess)

router.get('/category',usercontroller.category)

router.post('/cancelOrder/:orderId',usercontroller.cancelOrder)

router.post('/user/updateEmail',usercontroller.changeEmail)

router.get('/logout',usercontroller.logout)

router.get('/increaseCount/:productId',usercontroller.increaseCount)

router.get('/decreaseCount/:productId',usercontroller.decreaseCount)

router.get('/changepassword',usercontroller.ChangePassword)

router.post('/changepasswordPost',usercontroller.changePasswordPost)

// router.get('/newaddresscheckout',usercontroller.newaddressCkeckout);

router.get('/notfound',usercontroller.notfound)

router.post('/buynow/:productId',usercontroller.buynow)

router.get('/buynowcheckoutpage',usercontroller.buynowcheckoutpage)

router.get('/buynowSuccess',usercontroller.buySuccess)

router.post('/searchprdt',usercontroller.searchprdt)

// whislist ----------------------------------------------->

router.get('/wishlist', wishlistController.whislist)

router.get('/wishlistadd/:productId',isLoggedAuth, wishlistController.addToWishlist)

router.post('/wishlistAddToCart',isLoggedAuth,wishlistController.wishlistAddtoCart)

router.post('/removeFromWishlist',isLoggedAuth,wishlistController.removeFromWishlist)

// router.get('/razorpay',usercontroller.renderProductPage);

router.post('/createOrder',usercontroller.createOrder)









module.exports = router;
