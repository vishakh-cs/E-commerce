const mongoose = require('mongoose');

// Define a schema for the referral model
const referralSchema = new mongoose.Schema({
  referralCode: {
    type: String,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference the User model
    required: true,
  },
  isRefferalVerified : {
    type: Boolean,
    default: false,
  },
});

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
