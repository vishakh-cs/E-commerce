const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', 
        required: true
    },
    status: {
        type: String,
        default: "pending"
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Reference the Product model
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            },
            productImage: {
                type: String, 
                required: true
            }
        }
    ],
    orderDate: {
        type: Date,
        default: Date.now
    },
    payment: {
        method: {
            type: String
        },
    },
    totalPrice: {
        type: Number, 
        required: true 
    }
});

const order = mongoose.model("order", orderSchema);

module.exports = order;
