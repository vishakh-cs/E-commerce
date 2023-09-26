const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    username : String,
    email: String,
    password : String,
    otp : String,
})
mongoose.connect("mongodb://localhost:27017/Ecommerce-Users",{
    useNewUrlParser: true,
  useUnifiedTopology: true,
})

.then(()=>{
    console.log("connected to database ");
})
.catch((error)=>{
    console.error("Something went wrong",error);
})
// create a user model using this schema 

const User = mongoose.model("User",Schema)
module.exports = User