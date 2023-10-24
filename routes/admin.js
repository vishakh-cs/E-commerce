var express = require('express');
var router = express.Router();
const admincontroller = require('../controller/admincontroller')
const multer = require('multer');
const isLoggedAdmin = require('../Middleware/isloggedAdmin')


// Create a Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/'); 
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); 
    },
  });
  
  // Create a Multer instance with the configured storage
  const upload = multer({ storage });

/* GET home page. */
router.get('/adminlogin',admincontroller.adminlogin)

router.post('/admin/login',admincontroller.adminloginpost)

router.get('/admindashboard',admincontroller.admindashboard)

router.get('/productmanagement',admincontroller.productmanagement)

router.get('/addproducts',isLoggedAdmin,admincontroller.addproducts)

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

router.get('/adminOrder',isLoggedAdmin,admincontroller.orderManagement)

router.post('/updatestatus', admincontroller.updateOrderStatus);

router.get('/sales-by-day',admincontroller.getSalesDataByDay);

module.exports = router;
