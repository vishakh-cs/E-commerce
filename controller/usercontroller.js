const nodemailer = require('nodemailer');
const usermodel = require("../models/usermodel");
const Products = require("../models/productmodel")
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');
const order = require('../models/orderModel');

// signup get
const signup = (req, res) => {
    res.render('signup');
}

// signup post
const signupPost = async (req, res) => {
    try {
      const OTP = randomstring.generate({ length: 4, charset: 'numeric' });
  
      // Hash the user's entered password before saving it to the database
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'wizmailer07@gmail.com',
          pass: process.env.APP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false, // Ignore SSL certificate verification
        },
      });
  
      const mailOptions = {
        from: 'wizmailer07@gmail.com',
        to: req.body.email,
        subject: 'test for node mailer',
        text: `Your OTP (One-Time Password) is: ${OTP}`,
      };
  
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).send('Error sending email');
        } else {
          console.log('Email sent:', info.response);
        }
      });
  
      // Create a new user object to the database
      const newUser = new usermodel({
        username: req.body.name,
        email: req.body.email,
        password: hashedPassword, // Store the hashed password
        otp: OTP,
      });
  
      // Save the user data to the database
      await newUser.save();
  
      // Set user data in the session
      req.session.user = {
        username: req.body.name,
        email: req.body.email,
        otp: OTP,
      };
      console.log("session",req.session);
  
      // Redirect to the OTP verification page
      res.redirect('/signupotp');
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).send("Error registering user");
    }
  };  

// render otp page
const otp = (req, res) => {
    res.render('otp');
}

// otppost - OTP verification
const otppost = async (req, res) => {
  try {
    // Extract the OTP digits entered by the user
    const otp1 = req.body.otp1;
    const otp2 = req.body.otp2;
    const otp3 = req.body.otp3;
    const otp4 = req.body.otp4;

    // Combine the OTP digits to form the complete OTP
    const combinedOTP = otp1 + otp2 + otp3 + otp4;

    // Retrieve user data from the session
    const userData = req.session.user;

    if (!userData) {
      return res.status(401).send('User data not found in the session.');
    }

    if (userData.otp === combinedOTP) {
      userData.otpVerified = true;

      // Redirect the user to the login page
      res.redirect('/login');

      // Schedule the OTP deletion after 3 minutes
      setTimeout(async () => {
        try {
          const userUpdate = await usermodel.updateOne(
            { email: userData.email },
            {
              $unset: { otp: 1 },
            }
          );

          if (userUpdate.nModified > 0) {
            console.log('OTP deleted after 3 minutes.');
          } else {
            console.log('No matching user found for OTP deletion.');
          }
        } catch (error) {
          console.error('Error deleting OTP:', error);
        }
      }, 3 * 60 * 1000); 
    } else {
      // Incorrect OTP
      // Delete user data from the database
      await usermodel.deleteOne({ email: userData.email });

      return res.status(401).send('Incorrect OTP. signup onemore time.');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).send('Error verifying OTP.');
  }
};


// login get
const login = (req,res)=>{
      res.render('login')
}


const forgotpassword = (req, res) => {
    res.render('forgotpassword');
}

const forgotpasswordPost = async (req, res) => {
  try {
    // Check if the provided email exists in the database
    const email = req.body.email; 
    req.session.email= email;

    // Generate a new OTP 
    const OTP = randomstring.generate({ length: 4, charset: 'numeric' });

    // Update the user's document in the database with the new OTP
    const updatedUser = await usermodel.findOneAndUpdate(
      { email },
      { forgototp: OTP },
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(400).send('Email not found');
    }

    // Send the OTP via email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'wizmailer07@gmail.com',
        pass: process.env.APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Ignore SSL certificate verification
      },
    });

    const mailOptions = {
      from: 'wizmailer07@gmail.com',
      to: email,
      subject: 'Forgot Password OTP',
      text: `Your OTP (One-Time Password) is: ${OTP}`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error('Error sending OTP email:', error);
        return res.status(500).send('Error sending OTP email');
      } else {
        console.log('OTP email sent:', info.response);
        // Redirect to the OTP verification page
        res.redirect('/otpverification');
      }
    });
  } catch (error) {
    console.error('Error in forgotpassword route:', error);
    res.status(500).send('Internal Server Error');
  }
};

// otpverification
const otpVerification = (req,res)=>{
  res.render('otpverification')
}

// const otpVerificationPost = async (req, res) => {
//    try {
//     res.redirect('/resetpassword');
//   } catch (error) {
//        console.error('Error in OTP verification:', error);
//        res.status(500).send('Internal Server Error');
//      }
//    };

const otpVerificationPost = async (req, res) => {
  try {
    const useremail = req.session.email;
    console.log("user-email",useremail);
if (!useremail) {
  return res.status(401).send('User data not found in the session.');
}
const email = useremail;
    const otp = req.body.otp;
    console.log("otpentered",otp);
    // Check if the OTP matches the one stored in the user's document in the database
    const user = await usermodel.findOne({ email });
    console.log('User:', user);

    if (!user) {
     
      return res.status(404).send('User not found');
    }

    if (user.forgototp === otp) {
      
      return res.redirect('/resetpassword');
    } else {
      // Incorrect OTP, you can handle this case as needed
      return res.status(400).send('Incorrect OTP');
    }
  } catch (error) {
    console.error('Error in OTP verification:', error);
    res.status(500).send('Internal Server Error');
  }
};

const resendOTP = async (req, res) => {
  try {
      const useremail = req.session.email;
      if (!useremail) {
          return res.status(401).send('User data not found in the session.');
      }

      // Generate a new OTP 
      const resendOTP = randomstring.generate({ length: 4, charset: 'numeric' });

      // Update the user's document in the database with the new OTP
      const updatedUser = await usermodel.findOneAndUpdate(
          { email: useremail },
          { forgototp: resendOTP },
          { new: true }
      );

      if (!updatedUser) {
          return res.status(400).send('User not found');
      }
      // Send the OTP via email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'wizmailer07@gmail.com',
        pass: process.env.APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Ignore SSL certificate verification
      },
    });

    const mailOptions = {
      from: 'wizmailer07@gmail.com',
      to: useremail, 
      subject: 'Forgot Password OTP',
      text: `Your resended OTP (One-Time Password) is: ${resendOTP}`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error('Error sending OTP email:', error);
        return res.status(500).send('Error sending OTP email');
      } else {
        console.log('OTP email sent:', info.response);
        // Redirect to the OTP verification page
        res.redirect('/otpverification');
      }
    });
  } catch (error) {
    console.error('Error in forgotpassword route:', error);
    res.status(500).send('Internal Server Error');
  }
};


// render the reset password
const resetpass = (req,res)=>{
  res.render('resetpass')

}
// rset pass post
const resetPasswordPost = async (req, res) => {
  try {
    const newPassword = req.body.password;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const email = req.session.email;

    const user = await usermodel.findOneAndUpdate({ email }, { password: hashedPassword });

    if (!user) {
      
      return res.status(404).send('User not found');
    }

    // Password reset successful, 
    return res.redirect('/login');
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).send('Internal Server Error');
  }
};



const loginpost = async (req, res) => {
  const loginemail = req.body.email;
  const password = req.body.password;
  console.log("login mail",loginemail);

  try {
    const user = await usermodel.findOne({ email: loginemail });

    if (user && await bcrypt.compare(password, user.password)) {
       // storing name and password on session
       req.session.logedUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        cart:user.cart, 
    };
    console.log("i am loged ",req.session.logedUser);
      res.redirect('/');
    } else {
      res.send("Invalid username or password");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login");
  }
};

// home
const home = async(req, res) => {
  try {
    // Fetch all products from the database
    const products = await Products.find();
const userID = req.session.logedUser
const user = await usermodel.findById(userID);
    // Render the product list page with the fetched products
    res.render('home', { products,user }); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

const productview = async(req, res) => {
  try {
   
    const product = await Products.findById(req.params.productId);

    // Get the first image URL
    const firstImageUrl = product.images[0]; // images is an array of image URLs

    // Render the product view page and pass the product and firstImageUrl 
    res.render('productview', { product, firstImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


//<-------------------------------------------------- cart controll-------------------------------------------------->


// render cart 
const cart = async (req, res) => {
  try {
      // Check if req.session.logedUser exists
      if (!req.session.logedUser || !req.session.logedUser.cart) {
          return res.status(404).send('Cart not found');
      }

      // Fetch products from the database based on the user's cart items
      const array = req.params.userid;
      const userCart = req.session.logedUser.cart;

      console.log('cartitem',userCart);
      const cartProducts = await Promise.all(userCart.map(async (cartItem) => {
          const product = await Products.findById(cartItem.productId);
          return {
              product,
              quantity: cartItem.quantity
          };
      }));
      console.log('promise',cartProducts);

      // Calculate total price
      const totalPrice = cartProducts.reduce((total, item) => total + item.product.price * item.quantity, 0);

      // Render the cart page with cart products and total price
      res.render('cart', { cartProducts, totalPrice });
  } catch (error) {
      console.error('Error rendering cart page:', error);
      res.status(500).send('Internal Server Error');
  }
}

// add to cart 
const addToCart = async (req, res) => {
  try {
    const userId = req.session.logedUser._id;

    if (!userId) {
      return res.redirect('/');
    }

    const { productId } = req.params;
    req.session.logedUser = req.session.logedUser || { cart: [] };

    const product = await Products.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const userCart = req.session.logedUser.cart;

    // to check product is already in the cart
    const existingProductIndex = userCart.findIndex(item => item.productId.toString() === productId);

    if (existingProductIndex !== -1) {
      // If product already exists, increase its quantity
      userCart[existingProductIndex].quantity += 1;
    } else {
      
      userCart.push({
        productId: productId,
        quantity: 1
      });
    }

    req.session.logedUser.cart = userCart;

    req.session.save(async (err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      try {
        const saveCart =  req.session.logedUser.cart
        console.log("seved ",saveCart);
        const user = await usermodel.findById(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        user.cart = saveCart; 
        await user.save();

        return res.status(200).json({ message: 'Product added to cart', cart: userCart });
      } catch (error) {
        console.error('Error updating user cart in the database:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    console.log("user cart ", userCart);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



// remove from cart
const remove = async (req, res) => {
  try {
    const userId = req.session.logedUser._id; 
    const productId = req.params.productId;

 
    const user = await usermodel.findByIdAndUpdate(
        userId,
        {
            $pull: { 'cart': { productId } },
        },
        { new: true }
    );
        console.log(user);
    if (!user) {
        return res.json({ success: false, error: 'User not found' });
    }

    req.session.logedUser.cart = user.cart

    await user.save();
    // console.log("saved user",user);   
    res.json({ success: true });
} catch (error) {
    console.error('Error removing item from cart:', error);
    res.json({ success: false, error: 'Internal server error' });
}
}

// user profle 
const profile = async(req,res)=>{
  try {
    
    const userId = req.session.logedUser._id; 
    const user = await usermodel.findById(userId); 

    if (!user) {
   
        return res.status(404).send('User not found');
    }
    res.render('profile', { user }); 
} catch (error) {
    console.error('Error rendering user profile:', error);
    res.redirect('/login')
}
}

// profile post

const profilepost = async (req, res) => {
  try {
    const userId = req.session.logedUser._id;
    const user = await usermodel.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (req.file) {
      user.profileImage = req.file.path.substring(7);
      console.log(user.profileImage);
      await user.save();
    }

    // Redirect back to the profile page after the upload
    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).send('Internal Server Error');
  }
}

// set primary 

const setPrimaryAddress = async (req, res) => {
  console.log("hi im here");
  const userId = req.session.logedUser._id;
  const addressId = req.params.id;

  try {
      const user = await usermodel.findById(userId);
      
      if (!user) {
          return res.status(404).send('User not found');
      }

      user.addresses.forEach((address) => {
          if (address._id.toString() === addressId) {
              address.primary = true;
          } else {
              address.primary = false;
          }
      });

      await user.save();
      res.redirect('/profile'); 
  } catch (error) {
      console.error('Error setting primary address:', error);
      res.status(500).send('Internal Server Error');
  }
};



const addAddresspost = async (req, res) => {
  try {
    const userId = req.session.logedUser._id; 

    // Extract address details from the request body
    const { tag, address, city, pin, state, country, phone } = req.body;

    // Find the user by ID
    const user = await usermodel.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Create a new address object
    const newAddress = {
      tag,
      address,
      city,
      pin,
      state,
      country,
      phone,
    };

    user.addresses.push(newAddress);


    await user.save();

    // Redirect the user to their profile page
    res.redirect('/profile');
  } catch (error) {
    console.error('Error adding new address:', error);
    res.status(500).send('Internal Server Error');
  }
}

// dispaly add new address
const addnewaddress = (req,res)=>{
  res.render('addnewaddress')
}

// delete address 

const deleteAddressPost = async (req, res) => {
  const userId = req.session.logedUser._id;
  const addressId = req.params.addressId;

  try {
      const user = await usermodel.findById(userId);

      if (!user) {
          return res.status(404).send('User not found');
      }
      const addressIndex = user.addresses.findIndex(address => address._id.toString() === addressId);

      if (addressIndex === -1) {
          return res.status(404).send('Address not found');
      }

      
      user.addresses.splice(addressIndex, 1);

      // Save the updated user object
      await user.save();

      res.redirect('/profile');
  } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).send('Internal Server Error');
  }
};

// checkout page 
const checkout = async (req, res) => {
  try {
    if (!req.session.logedUser) {
      return res.redirect('/login');
    }

    const userId = req.session.logedUser._id;
    const user = await usermodel.findById(userId);

    // Find the primary address in the user's addresses array
    const primaryAddress = user.addresses.find((address) => address.primary === true);

    // Fetch user's cart products and calculate the total price
    const userCart = user.cart || [];
    if (userCart.length === 0) {
      // Redirect the user to a shopping cart page or display a message
      return res.redirect('/cart/:userid'); // You can change this URL
    }
    const cartProducts = await Promise.all(userCart.map(async (cartItem) => {
      const product = await Products.findById(cartItem.productId);
      return {
        product,
        quantity: cartItem.quantity
      };
    }));
    // Calculate the total price
    const totalPrice = cartProducts.reduce((total, item) => total + item.product.price * item.quantity, 0);
    res.render('checkout', {
      user,
      primaryAddress,
      cartProducts,
      totalPrice
    });
  } catch (error) {
    console.error('Error rendering checkout page:', error);
    res.status(500).send('Internal Server Error');
  }
};

// order success page

const orderSuccess = async (req, res) => {
  try {
    if (!req.session.logedUser) {
      return res.redirect('/login');
    }

    const userId = req.session.logedUser._id;
    const user = await usermodel.findById(userId);

    // Fetch user's cart products and populate the product details
    const cartProducts = await Promise.all(user.cart.map(async (cartItem) => {
      const populatedCartItem = await usermodel.populate(cartItem, {
        path: 'productId',
        model: 'Product' 
      });
      return {
        product: populatedCartItem.productId,
        quantity: cartItem.quantity
      };
    }));

    // Calculate the total price of the order
    const totalPrice = cartProducts.reduce((total, cartItem) => {
      return total + (cartItem.product.price * cartItem.quantity);
    }, 0);

    // Create a new order document
    const newOrder = new order({
      userId: userId,
      address: user.addresses[0]._id,
      products: cartProducts.map((cartItem) => ({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
        productImage: cartItem.product.images.join(', ') 
        
      })),
      totalPrice: totalPrice
    });

    // Save the new order to the database
    await newOrder.save();

    const orderDetails = {
      productNames: cartProducts.map((cartItem) => cartItem.product.name).join(', '),
      productImages: cartProducts.map((cartItem) => cartItem.product.images)
    };

    // Render the order success page with user and order details
    res.render('successorder', {
      user,
      cartProducts,
      orderDetails,
      totalPrice // Pass the total price to the view for display
    });

    // Clear the user's cart
    user.cart = [];
    await user.save();
    req.session.logedUser.cart = [];
  } catch (error) {
    console.error('Error rendering order success page:', error);
    res.status(500).send('Internal Server Error');
  }
};

// increment cart item

const incrementQuantity = async (req, res) => {
  console.log("hi im plus");
  const productId = req.params.productId;
  const userId = req.session.loggedUser._id;
  try {
      // Find the user's cart and increment the quantity of the product
      const user = await usermodel.findOneAndUpdate(
          { _id: userId, 'cart.product': productId },
          { $inc: { 'cart.$.quantity': 1 } }, // increment quantity
          { new: true } // return the updated user
      );
      if (user) {
          res.json({ message: 'Quantity incremented successfully', cart: user.cart });
      } else {
          res.status(404).json({ message: 'Product not found in the cart' });
      }
  } catch (error) {
      console.error('Error incrementing quantity:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


// decrement cart items






module.exports = {
    signup,
    login,
    home,
    productview,
    otp,
    forgotpassword,
    signupPost,
    otppost,
    loginpost,
    forgotpasswordPost,
    otpVerification,
    otpVerificationPost,
    resetpass,
    resetPasswordPost,
    cart,
    resendOTP,
    addToCart,
    remove,
    profile,
    profilepost,
    addAddresspost,
    addnewaddress,
    deleteAddressPost,
    checkout,
    setPrimaryAddress,
    orderSuccess,
    incrementQuantity,

};