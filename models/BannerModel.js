const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imageName: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    
});


const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
