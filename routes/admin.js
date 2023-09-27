var express = require('express');
var router = express.Router();
const admincontroller = require('../controller/admincontroller')

/* GET home page. */
router.get('/adminlogin',admincontroller.adminlogin)

router.post('/admin/login',admincontroller.adminloginpost)

router.get('/admindashboard',admincontroller.admindashboard)

router.get('/productmanagement',admincontroller.productmanagement)

router.get('/addproducts',admincontroller.addproducts)

module.exports = router;
