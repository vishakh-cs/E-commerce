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

router.get('/categories',admincontroller.category)

router.post('/categories',admincontroller.categoryManagement)

router.delete('/categories/:id',admincontroller.removeCategory);

router.post('/categories/:id/add-subcategory',admincontroller.addSubcategory);

router.get('/edit/:id',admincontroller.editproducts)

router.post('/edit/:id',admincontroller.editproductspost)

router.get('/user',admincontroller.usermangement)

router.get("/edituser/:id", admincontroller.edituser);

router.post('/edituser/:id',admincontroller.edituserpost);

router.post('/admin/deleteuser/:id', admincontroller.deleteUser);

router.post('/admin/blockuser/:id', admincontroller.blockUser);

router.post('/admin/unblockuser/:id', admincontroller.unblockUser);

router.post('/admin/user-search', admincontroller.searchUsers);

router.post('/delete/:id',admincontroller.deleteProduct);

router.post('/admin/add-product',upload.array('images'),admincontroller.addproductspost)

router.get('/adminOrder',admincontroller.orderManagement)

router.post('/updatestatus', admincontroller.updateOrderStatus);

module.exports = router;
