const mongoose = require('mongoose');

// Define a schema for the coupon model
const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  minPurchase: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

// Create a model using the schema
const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;