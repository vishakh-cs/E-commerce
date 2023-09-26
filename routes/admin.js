var express = require('express');
var router = express.Router();
const admincontroller = require('../controller/admincontroller')

/* GET home page. */
router.get('/adminlogin',admincontroller.adminlogin)

module.exports = router;
