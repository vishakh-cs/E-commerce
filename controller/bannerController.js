const usermodel = require("../models/usermodel");
const Products = require("../models/productmodel")
const order = require('../models/orderModel');
const BannerModel = require('../models/BannerModel')
const sharp = require('sharp');
const fs = require('fs');


const bannerManagement = async (req, res) => {
   try {
      
       const bannerDb = await BannerModel.find(); 
       res.render('admin/banner', { bannerDb });
   } catch (error) {
       console.error('Error fetching banner details:', error);
       res.status(500).send('Error fetching banner details');
   }
};


const addBannerData = async (req, res) => {
    const AddBannerImages = req.files;
    const BannerName = req.body.BannerName;

    const uploadedImage = AddBannerImages[0];
    const imageUrl = uploadedImage.path.substring(7); // Remove 'public' from the path

    // Resize the image to 1360 x 600
    const resizedImagePath = `public/uploads/resized_${uploadedImage.filename}`;
    sharp(uploadedImage.path)
        .resize(1360, 600)
        .toFile(resizedImagePath, (err, info) => {
            if (err) {
                console.error('Error resizing image:', err);
                return res.status(500).send('Error resizing image');
            }
            const banner = new BannerModel({
                imageName: BannerName,
                imageUrl: `uploads/resized_${uploadedImage.filename}`,
            });
            banner.save()
                .then(() => {
                    // Remove the original image
                    fs.unlink(uploadedImage.path, (unlinkError) => {
                        if (unlinkError) {
                            console.error('Error deleting original image:', unlinkError);
                        }
                        res.redirect('back');
                    });
                })
                .catch((saveError) => {
                    console.error('Error adding banner:', saveError);
                    res.status(500).send('Error adding banner');
                });
        });
};


const removeBannerImage = async (req, res) => {
    const bannerId = req.body._id;
    console.log("id of banner", bannerId);
    try {
        const removedImage = await BannerModel.findByIdAndDelete(bannerId);
        console.log("after removal", bannerId);
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting banner' });
    }
}




 


 module.exports = {
    bannerManagement,
    addBannerData,
    removeBannerImage,
 }
