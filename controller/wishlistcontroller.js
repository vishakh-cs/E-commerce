const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')
const categoryModel = require("../models/categoryModel")
const orderModel = require('../models/orderModel')


const whislist = async (req, res) => {
    try {
        const userId = req.session.logedUser._id;
        // const user = await usermodel.findById(userId);

        // Find products in the user's wishlist((it checks the id in both product db and in user.wishlist))
        // $in operator allows to find documents in the productmodel whose id matches any of the id values in the user.wishlist array.
        const user = await usermodel.findById(userId).populate('wishlist.productId'); 

        res.render('wishlist', { wishlist: user.wishlist });
    } catch (error) {
        console.error("Error fetching user's wishlist:", error);
        res.status(500).send("Internal Server Error");
    }
};

// add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userid = req.session.logedUser._id;

        // Check if the product is already in the user's wishlist
        const user = await usermodel.findById(userid);
        if (user.wishlist.includes(productId)) {
            return res.json("Item is already in the wishlist.");
        }

        // If the product is not in the wishlist, add it
        const product = await productmodel.findById(productId);
        if (!product) {
            return res.status(404).json("Product not found.");
        }
        user.wishlist.push({
            productId: productId
        }); 
        await user.save();
         req.session.logedUser = user;
     res.redirect('/')
    } catch (error) {
        console.error("Error adding item to wishlist:", error);
        return res.status(500).json("Internal Server Error");
    }
};

// wishlist to cart

const wishlistAddtoCart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.logedUser._id;
        console.log("im here cart", productId);

        const product = await productmodel.findById(productId);
        console.log("product", product);
        if (!product) {
            return res.status(404).json("Product not found.");
        }

        const user = await usermodel.findById(userId);

        const updateduser = {
            productId: product._id,
            quantity: 1,
        }
        console.log(`updates DATA :${updateduser}`);

        // Add the product to the user's cart
        user.cart.push(updateduser);
        await user.save();
        // req.session.logedUser = user;
        console.log("helloooo");
        res.status(200).json("success") // Redirect to the cart page or any other appropriate destination
    } catch (error) {
        console.error("Error adding item to cart from wishlist:", error);
        return res.status(500).json("Internal Server Error");
    }
};


// remove from cart
const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.body.productId; 
        const userId = req.session.logedUser._id;
        console.log("prdtid",productId);
        const user = await usermodel.findByIdAndUpdate(userId)
        user.wishlist.pull(productId)
        await user.save()

        return res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};








module.exports ={
    whislist,
    addToWishlist,
    wishlistAddtoCart,
    removeFromWishlist,
}