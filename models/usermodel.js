const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state : {
        type:String ,
    },
    pin: {
        type: Number,
        match: /^\d{6}$/,
    },
    country : {
        type:String
    },
    phone : {
        type:Number
    },
    primary :{
        type:Boolean,
        default:false
    }
});

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['credit', 'debit'], 
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const Schema = new mongoose.Schema({
    username : {
        type: String,
        required: true
        },
    email: {
        type:String ,
        required:true
        },

    password : {
        type:String  ,
        required:true
        },
        otp : {
            type:String,
            required:false
        },
        forgototp : {
            type:String,
        },
        isblocked: {
            type: Boolean,
            required: true,
            default: false
        },
        wallet: {
            amount: {
                type: Number,
                default: 0,
            },
            transactions: [walletTransactionSchema],
        },
        profileImage: {
            type: String,
            required:false,
        },
     wishlist: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                }
            }
        ],
        addresses: [addressSchema],
        cart: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1 // Default quantity 1
                }
            }
        ]
            
})

// create a user model using this schema 

const User = mongoose.model("User",Schema)
module.exports = User