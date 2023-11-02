const usermodel = require("../models/usermodel");
const Products = require("../models/productmodel")
const order = require('../models/orderModel');
const BannerModel = require('../models/BannerModel')


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

   const imageUrl = AddBannerImages[0].path.substring(7); 

   const banner = new BannerModel({
       imageName: BannerName,
       imageUrl: imageUrl,
   });

   try {
       await banner.save();
       res.redirect('back');
   } catch (error) {
       console.error('Error adding banner:', error);
       res.status(500).send('Error adding banner');
   }
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
