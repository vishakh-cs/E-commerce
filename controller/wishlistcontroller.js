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
        const updatedUser = await usermodel.findOneAndUpdate(
            {
                _id: userid,
                "wishlist.productId": { $ne: productId } // Check the product not in  wishlist --->
            },
            {
                $push: {
                    wishlist: {
                        productId: productId
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.json("Item is already in the wishlist.");
        }

        req.session.logedUser = updatedUser;
        res.redirect('/');
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
        console.log("helloooo");
        res.status(200).json("success") 
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