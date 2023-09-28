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
        isblocked: {
            type: Boolean,
            required: true,
            default: false
        }
            
})

// create a user model using this schema 

const User = mongoose.model("User",Schema)
module.exports = User