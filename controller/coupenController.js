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

const applyDiscount = async (req, res) => {
    try {
        const userId = req.body.userID;
        const productId = req.body.productID;
        const enteredCoupon = req.body.couponCode;

        // Check if the coupon exists
        const coupon = await CouponModel.findOne({ couponCode: enteredCoupon });
        
        if (!coupon) {
            return res.redirect('/checkout?InvalidCode=true');
        }

        // Check if the coupon has expired
        const currentDate = Date.now();
        if (currentDate > coupon.endDate) {
            return res.status(403).json({ message: 'This coupon has expired.' });
        }

        // Fetch the product and check if it has an offer price
        const product = await productmodel.findById(productId);
        let productPrice = product.price;

        // Check if the product has an offer price, use it as the product price
        if (product.offerPrice && product.offerPrice < productPrice) {
            productPrice = product.offerPrice;
        }

        // Check the product price and the minPurchase
        if (productPrice < coupon.minPurchase) {
            return res.status(403).json({ message: `The minimum purchase for this coupon is ${coupon.minPurchase}` });
        } else {
            const discountAmount = productPrice - coupon.discountAmount;
            const Amount = coupon.discountAmount;
            req.session.finalAmount = Amount;
            req.session.PriceAfterCoupon = discountAmount;
            req.session.enteredCoupon = enteredCoupon;
            res.status(200).redirect('back');
        }
    } catch (error) {
        console.error("Error applying discount:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};





module.exports = {
    coupon,
    newcoupon,
    deletecoupon,
    applyDiscount,
}