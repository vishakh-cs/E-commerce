const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String, 
    required: true,
  },
  subcategory: { 
    type: String,
    required: false, 
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  OutofStock : {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5, 
  },
  offers: {
    type: String,
  },
  images: [
    {
      type: String, // Store the image URLs as strings
      required: true,
    },
  ],
  croppedImage: {
    type: String, // Store the cropped image data as a string
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
