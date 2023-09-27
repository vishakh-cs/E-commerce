var express = require('express');
var router = express.Router();
const admincontroller = require('../controller/admincontroller')
const multer = require('multer');


// Create a Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/'); // Set the destination folder where uploaded files will be stored
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Use the original filename for storing the file
    },
  });
  
  // Create a Multer instance with the configured storage
  const upload = multer({ storage });

/* GET home page. */
router.get('/adminlogin',admincontroller.adminlogin)

router.post('/admin/login',admincontroller.adminloginpost)

router.get('/admindashboard',admincontroller.admindashboard)

router.get('/productmanagement',admincontroller.productmanagement)

router.get('/addproducts',admincontroller.addproducts)

router.post('/admin/add-product',upload.array('images'),admincontroller.addproductspost)

module.exports = router;
