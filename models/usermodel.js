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
    contry : {
        type:String
    },
    phone : {
        type:Number
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
        profileImage: {
            type: String,
            required:false,
        },
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