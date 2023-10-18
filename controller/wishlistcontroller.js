const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')
const categoryModel = require("../models/categoryModel")
const orderModel = require('../models/orderModel')


const whislist = async (req, res) => {
    try {
        const userId = req.session.logedUser._id;
        const user = await usermodel.findById(userId);

        // Find products in the user's wishlist((it checks the id in both product db and in user.wishlist))
        // $in operator allows to find documents in the productmodel whose id matches any of the id values in the user.wishlist array.
        const wishlistProducts = await productmodel.find({ _id: { $in: user.wishlist } });

        res.render('wishlist', { user, wishlistProducts });
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
        user.wishlist.push(productId);
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
        const userId = req.session.logedUser._id;
        const productId = req.body.productId;

        const user = await usermodel.findById(userId);

        if (!user) {
            return res.redirect('/login');
        }

        // Check if the product is already in the user's cart
        const existingProductInCart = user.cart.find(item => item.productId.toString() === productId);

        if (existingProductInCart) {
            existingProductInCart.quantity += 1;
        } else {
            user.cart.push({
                productId: productId,
                quantity: 1
            });
        }

        // Use $pull to remove the product from the wishlist directly in the database
        // await usermodel.findByIdAndUpdate(userId, {
        //     $pull: {wishlist: productId }
        // });

        // Save the user document after updating cart and wishlist
        await user.save();
        req.session.logedUser = user;

        // Return a success message
        return res.status(200).json({ message: 'Product added to cart successfully and removed from wishlist' });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};




module.exports ={
    whislist,
    addToWishlist,
    wishlistAddtoCart,
}