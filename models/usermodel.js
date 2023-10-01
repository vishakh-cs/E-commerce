const mongoose = require('mongoose')

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
            required:true
        },
        forgototp : {
            type:String,
        },
        isblocked: {
            type: Boolean,
            required: true,
            default: false
        },
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