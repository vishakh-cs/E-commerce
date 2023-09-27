const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    username : String,
    email: String,
    password : String,
    otp : String,
})

// create a user model using this schema 

const User = mongoose.model("User",Schema)
module.exports = User