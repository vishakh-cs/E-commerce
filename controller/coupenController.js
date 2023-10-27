const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')
const categoryModel = require("../models/categoryModel")
const orderModel = require('../models/orderModel')
const CouponModel = require('../models/coupon')


// coupon render
const coupon = async (req, res) => {
    try {
        const coupons = await CouponModel.find()
        .sort({ startDate: -1 }) 
        res.render('admin/coupon', { coupons }); 
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).send('Error fetching coupons');
    }
};


const newcoupon = async (req,res)=>{
    const { code,description, discount, minPurchase, startDate, endDate } = req.body;
    try {
    
        const coupon = await CouponModel.create({
            couponCode: code,
            description: description,
            discountAmount: discount,
            minPurchase: minPurchase,
            startDate: startDate,
            endDate: endDate
        });

        res.status(201).redirect('back')
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deletecoupon = async (req, res) => {
    try {
        const couponCode = req.body.couponCode; // Extract couponCode from req.body
        console.log("couponCode", couponCode);

        const coupons = await CouponModel.findOneAndDelete({ couponCode: couponCode });
        return res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




module.exports = {
    coupon,
    newcoupon,
    deletecoupon,
}