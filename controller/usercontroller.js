const nodemailer = require('nodemailer');
const usermodel = require("../models/usermodel");
const Products = require("../models/productmodel")
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');
const order = require('../models/orderModel');
const categorySchema = require('../models/categoryModel')
const Razorpay = require('razorpay');
require('dotenv').config();
var easyinvoice = require('easyinvoice');
const fs = require('fs');
const refferalModel = require('../models/refferalModel');
const BannerModel = require('../models/BannerModel');



// generate random string
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Generate a random 6-letter string
const referralCode = generateRandomString(6);

// signup get
const signup = (req, res) => {
  res.render('signup');
}

// signup post
const signupPost = async (req, res) => {
  try {

    const existingUser = await usermodel.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send('Email is already registered');
    }
    const OTP = randomstring.generate({ length: 4, charset: 'numeric' });
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

    // Generate a random 6-letter string for the referral code
      const referralCode = generateRandomString(6);

    // Create a new user object to the database
    const newUser = new usermodel({
      username: req.body.name,
      email: req.body.email,
      password: hashedPassword, 
      otp: OTP,
    });

    // Save the user data to the database
    await newUser.save();
      const newReferral = new refferalModel({ 
        referralCode: referralCode,
        userId: newUser._id, 
      });
  
      await newReferral.save();

    // Set user data in the session
    req.session.user = {
      username: req.body.name,
      email: req.body.email,
      otp: OTP,
    };
    console.log("session", req.session);

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
const login = (req, res) => {
  if(req.session.logedUser){
    res.redirect('/')
  }
  res.render('login')
}


// forgot password get
const forgotpassword = (req, res) => {
  res.render('forgotpassword');
}

// forgot password post
const forgotpasswordPost = async (req, res) => {
  try {
    const email = req.body.email;
    req.session.email = email;
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
const otpVerification = (req, res) => {
  res.render('otpverification')
}
// otp verification post
const otpVerificationPost = async (req, res) => {
  try {
    const useremail = req.session.email;
    console.log("user-email", useremail);
    if (!useremail) {
      return res.status(401).send('User data not found in the session.');
    }
    const email = useremail;
    const otp = req.body.otp;
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
        res.redirect('/otpverification');
      }
    });
  } catch (error) {
    console.error('Error in forgotpassword route:', error);
    res.status(500).send('Internal Server Error');
  }
};


// render the reset password
const resetpass = (req, res) => {
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
  console.log("login mail", loginemail);

  try {
    const user = await usermodel.findOne({ email: loginemail });

    if (!user) {
      return res.redirect('/login?notRegistered=true')
    }

    if (user.isblocked) {
      return res.json({ status: "Your account is blocked by admin" });
    }
    if (user && await bcrypt.compare(password, user.password)) {
      // storing name and password on session
      req.session.logedUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        cart: user.cart,
      };
      console.log("i am loged ", req.session.logedUser);
      res.redirect('/');
    } else {
      return res.redirect("/login?InvalidPassword=true");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login");
  }
};

// home
const home = async (req, res) => {
  try {
    const products = await Products.find();
    const userID = req.session.logedUser
    const showBanner = await BannerModel.find();
    const user = await usermodel.findById(userID);
    res.render('home', { products, user ,showBanner });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// product view 
const productview = async (req, res) => {
  try {

    const userID = req.session.logedUser
    const user = await usermodel.findById(userID);

    const product = await Products.findById(req.params.productId);

    // Get the first image URL
    const firstImageUrl = product.images[0]; // images is an array of image URLs

    // Render the product view page and pass the product and firstImageUrl 
    res.render('productview', { product, firstImageUrl , user });
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
       res.redirect('/login');
    }
    const userCart = req.session.logedUser.cart;

    console.log('cartitem', userCart);
    const cartProducts = await Promise.all(userCart.map(async (cartItem) => {
      try {
        const product = await Products.findById(cartItem.productId);
        if (!product) {
          console.error('Product not found for ID:', cartItem.productId);
          return null; // Handle the case where the product is not found
        }

        // Check if the product has an offerPrice, if so, use that for total calculation
        if (product.offerPrice) {
          product.price = product.offerPrice;
        }

        return {
          product,
          quantity: cartItem.quantity
        };
      } catch (err) {
        console.error('Error fetching product:', err);
        return null; // Return null for products that could not be found
      }
    }));
    console.log('promise', cartProducts);

    // Filter out null products
    const validCartProducts = cartProducts.filter((item) => item !== null);

    // Calculate total price
    const totalPrice = validCartProducts.reduce((total, item) => total + item.product.price * item.quantity, 0);

    // Render the cart page with valid cart products and total price
    res.render('cart', { cartProducts: validCartProducts, totalPrice });
  } catch (error) {
    console.error('Error rendering cart page:', error);
    res.status(500).send('Internal Server Error');
  }
};



// add to cart 
const addToCart = async (req, res) => {
  try {
    const userId = req.session.logedUser._id;

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
        const saveCart = req.session.logedUser.cart
        console.log("seved ", saveCart);
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
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.json({ success: false, error: 'Internal server error' });
  }
}

// cart increase 
const increaseCount = async (req, res) => {
  try {
    const productId = req.params.productId

    const product = await Products.findById(productId);
    if (!product) {
      return res.json({ success: false, error: 'product not found' });
    }

    const userCart = req.session.logedUser.cart;
    const userId = req.session.logedUser._id;

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

    req.session.save(async (err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      try {
        const saveCart = req.session.logedUser.cart
        console.log("seved ", saveCart);
        const user = await usermodel.findById(userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        user.cart = saveCart;
        await user.save();

        return res.redirect("back")
      } catch (error) {
        console.error('Error updating user cart in the database:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    });


  } catch (error) {
    console.error('Error increaseCount:', error);
    res.json({ error: 'Internal server error increaseCount ' });
  }
}

// decrement 
const decreaseCount = async (req, res) => {
  try {
      const productId = req.params.productId;
      const userCart = req.session.logedUser.cart;
      const userId = req.session.logedUser._id;

      // Find the index of the product in the cart
      const existingProductIndex = userCart.findIndex(item => item.productId.toString() === productId);

      if (existingProductIndex !== -1) {
          // If product already exists in the cart
          if (userCart[existingProductIndex].quantity > 1) {
              // Decrease the quantity only if it's greater than 1
              userCart[existingProductIndex].quantity -= 1;
          } else {
              // If quantity is 1, do not decrease it further
              return res.redirect("back")
          }
      } else {
          return res.json({ success: false, error: 'Product not found in the cart' });
      }
      req.session.save(async (err) => {
          if (err) {
              console.error('Error saving session:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
          try {
              const saveCart = req.session.logedUser.cart;
              const user = await usermodel.findById(userId);

              if (!user) {
                  return res.status(404).json({ error: 'User not found' });
              }

              user.cart = saveCart;
              await user.save();

              return res.redirect("back");
          } catch (error) {
              console.error('Error updating user cart in the database:', error);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
      });
  } catch (error) {
      console.error('Error decreaseCount:', error);
      res.json({ error: 'Internal server error decreaseCount' });
  }
};

// user profle 
const profile = async (req, res) => {
  try {
    const userId = req.session.logedUser._id;
    const user = await usermodel.findById(userId);

    if (user.isblocked) {
      return res.json({ status: "Your account is blocked by admin" });
    }

    // Fetch the user's recent orders and populate products
    const recentOrders = await order
      .find({ userId: userId })
      .sort({ orderDate: -1 })
      .populate('products'); 

    // Iterate through recent orders and populate product images
    for (const order of recentOrders) {
      for (const orderProduct of order.products) {
        const product = await Products.findById(orderProduct.product);
        if (product && product.images.length > 0) {
          orderProduct.productImage = product.images[0]; // use the first image in the array
        }
      }
    }
    
    user.recentOrders = recentOrders.map((order) => ({
      orderId: order._id,
      status: order.status,
      totalPrice: order.totalPrice,
      products: order.products,
    }));

    const walletTransactions = user.wallet.transactions

      // Fetch the referral code associated with the user
      const referral = await refferalModel.findOne({ userId: userId });

    res.render('profile', { user, walletAmount: user.wallet.amount ,walletTransactions, referral});
  } catch (error) {
    console.error('Error rendering user profile:', error);
    res.redirect('/login');
  }
};


// inputRefferalCode
const inputRefferalCode = async (req, res) => {
  try {
    const referralCode = req.body.referralCode;
    const userId = req.session.logedUser._id;
    const referral = await refferalModel.findOne({ referralCode: referralCode });
    const userreffered = await usermodel.findById(userId)
    // user reffered is user owner of the refferal code
    const referralToUpdate = await refferalModel.findOne({ userId });
    
    if(referralCode == referralToUpdate.referralCode ){
      return res.redirect('/profile?cantEnterSameReferralCode=true')
    }


    if (!referral) {
      return res.redirect('/profile?InvalidRefferal=true')
    }

    // Find the user associated with the referral code
    const referredUser = await usermodel.findById(referral.userId);

    if (!referredUser) {
      return res.send("Error: Referred user not found");
    }
    referredUser.wallet.amount += 100;
    const creditTransaction = {
      type: "credit",
      amount: 100,
      description: "Referral bonus",
      date: new Date(),
    };

    referredUser.wallet.transactions.push(creditTransaction);
    await referredUser.save();


    if (referralToUpdate) {

      userreffered.wallet.amount += 50;
      const creditTransaction = {
        type: "credit",
        amount: 50,
        description: "Reffered bonus",
        date: new Date(),
      };
      userreffered.wallet.transactions.push(creditTransaction);
      referralToUpdate.isRefferalVerified = true;
      await referralToUpdate.save();
      await userreffered.save();
    } else {
      return res.status(404).send("Referral not found for the user.");
    }

    res.redirect("/profile");
  } catch (error) {
    console.error("Error processing referral code:", error);
    res.status(500).send("Internal Server Error");
  }
};


// view order details
const vieworder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderitems = await order.findById(orderId).populate('products')
    if (!orderitems) {
      return res.status(404).send('Order not found');
    }
    const products = await Products.find({ _id: { $in: orderitems.products.map(item => item.product) } });
    console.log("pro",products);
    const user = await usermodel.findById(orderitems.userId);
    console.log("log im user",user);
    res.render('vieworderdetails', { orderitems , products , user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


//return order
const returnOrder = async (req, res) => {
  console.log("im here");
  try {
    const userId = req.params.userId;
    const orderId = req.params.orderId;
    const updatedStatus = 'returned';

    // Find the user by userId
    const user = await usermodel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const orderprdt = await order.findById(orderId);

    if (!orderprdt) {
      return res.status(404).json({ status: 'Order not found' });
    }
    if (orderprdt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (orderprdt.status !== 'Delivered') {
      return res.redirect('/profile')
    }
    const refundAmount = orderprdt.totalPrice;
    console.log('Current order status:', orderprdt.status);

    orderprdt.status = updatedStatus;
    await orderprdt.save();
    user.wallet.amount += refundAmount;
    user.wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: 'Order return refund',
    });
    await user.save();
    res.status(200).redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


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
    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).send('Internal Server Error');
  }
}

// edit user email
const changeEmail = async (req, res) => {
  const useremail = req.session.logedUser.email;
  const newEmail = req.body.newEmail; 
  try {
    const user = await usermodel.findOne({ email: useremail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.email = newEmail;
    await user.save();

    return res.json({ message: 'User email updated successfully', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error updating email' });
  }
};


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

// change password
// render change passwword page 
const ChangePassword = (req,res)=>{
  try{
  const userId = req.session.logedUser._id;
  if(!userId){
    return  res.redirect('/login') ;
  }  else{
    res.render('changepassword')
  }
} catch (error) {
  console.error('Error setting primary address:', error);
  res.status(500).send('Internal Server Error');
}}

// change password post 
const changePasswordPost = async (req, res) => {
  try {
    const newPassword = req.body.password;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const email = req.session.logedUser.email;
    console.log("saru",email);

    const user = await usermodel.findOneAndUpdate({email }, { password: hashedPassword });

    if (!user) {

      return res.status(404).send('User not found');
    }
    return res.redirect('/login');
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).send('Internal Server Error');
  }
};


// add address post
const addAddresspost = async (req, res) => {
  try {
    const userId = req.session.logedUser._id;

    // Extract address details from the request body
    const { tag, address, city, pin, state, country, phone } = req.body;

    // Find the user by ID
    const user = await usermodel.findById(userId);
    if (user.addresses.length >= 2) {
      // If the user already has 2 addresses, prevent adding more
      return res.redirect('/profile?maxAddressesReached=true');
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
    res.redirect('/profile');
  } catch (error) {
    console.error('Error adding new address:', error);
    res.status(500).send('Internal Server Error');
  }
}

// dispaly add new address
const addnewaddress = (req, res) => {
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
    let primaryAddress = user.addresses.find((address) => address.primary === true);

    // If no primary address is found, set the first address as primary
    if (!primaryAddress && user.addresses.length > 0) {
      primaryAddress = user.addresses[0]; 
      primaryAddress.primary = true;
    }
    await user.save();

    // Fetch user's cart products and calculate the total price
    const userCart = user.cart || [];
    if (userCart.length === 0) {
      // Redirect the user to a shopping cart page or display a message
      return res.redirect('/cart/:userid');
    }

    const cartProducts = await Promise.all(userCart.map(async (cartItem) => {
      try {
        const product = await Products.findById(cartItem.productId);
        if (!product) {
          throw new Error('Product not found');
        }

        // Calculate the product price based on offer or regular price
        const price = product.offerPrice ? product.offerPrice : product.price;

        return {
          product,
          quantity: cartItem.quantity,
          price,
        };
      } catch (err) {
        console.error('Error fetching product:', err);
        return null;
      }
    }));

    // Filter out null products
    const validCartProducts = cartProducts.filter((item) => item !== null);

        // Store product quantity in session for further processing
        const productQuantities = validCartProducts.map((item) => item.quantity);
        req.session.productQuantities = productQuantities;

    // Calculate the total price
    let totalPrice = validCartProducts.reduce((total, item) => total + item.price * item.quantity, 0);

    req.session.checkouttotalPrice = totalPrice;
    req.session.cartItems = validCartProducts;

    // Check if a coupon has been applied
    const appliedCoupon = req.session.PriceAfterCoupon;
    if (appliedCoupon) {
      // Apply the coupon discount
      totalPrice -= appliedCoupon;
    }

    res.render('checkout', {
      user,
      discountAmount: appliedCoupon,
      primaryAddress,
      cartProducts: validCartProducts,
      totalPrice,
    });

    req.session.couponAfterPrice =  req.session.PriceAfterCoupon
    req.session.PriceAfterCoupon = [];
    
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
    const paymenttype = req.session.paymentMethod
    console.log("im payment",paymenttype);
    const enteredCode = req.session.enteredCoupon

    const userId = req.session.logedUser._id;
    const user = await usermodel.findById(userId);
    const cartProducts = await Promise.all(user.cart.map(async (cartItem) => {
      try {
        const populatedCartItem = await usermodel.populate(cartItem, {
          path: 'productId',
          model: 'Product'
        });
        if (!populatedCartItem.productId) {
          throw new Error('Product not found'); // Handle the case where the product is not found
        }
        return {
          product: populatedCartItem.productId,
          quantity: cartItem.quantity
        };
      } catch (err) {
        console.error('Error fetching product:', err);
        return null; // Return null for products that could not be found
      }
    }));

    // Filter out null products
    const validCartProducts = cartProducts.filter((cartItem) => cartItem !== null);
    let discountprice = req.session.finalAmount
    const applyedCoupon = req.session.PriceAfterCoupon

   // Calculate the total price of the order
   let totalPrice = validCartProducts.reduce((total, cartItem) => {
    let productPrice = cartItem.product.price;
    if (cartItem.product.offerPrice) {
        productPrice = cartItem.product.offerPrice; // Use the offer price if available
    }
    return total + (productPrice * cartItem.quantity);
}, 0);

if (Array.isArray(discountprice)) {
    // Handle the case where discountprice is an array
    discountprice = 0; // or set it to the desired default value
}
    if(discountprice){
    totalPrice -= discountprice
    }
    if (paymenttype === 'wallet-transfer') {
      // Check if the user has enough balance in their wallet
      if (user.wallet.amount < totalPrice) {
        return res.redirect('/checkout?InsufficientBalance=true');
      }
      user.wallet.amount -= totalPrice;

      await user.save();
    }

    // Create a new order document
    const newOrder = new order({
      userId: userId,
      address: user.addresses[0]._id,
      products: validCartProducts.map((cartItem) => ({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
        productImage: cartItem.product.images.join(', ')
      })),
      coupon : enteredCode,
      discountAmount : discountprice,
      totalPrice: totalPrice ,
      payment: {
        method: paymenttype
    }
    });
    await newOrder.save();

        // Decrease the quantity of each product in the cart
        for (const cartItem of validCartProducts) {
          const product = cartItem.product;
          const updatedQuantity = product.quantity - cartItem.quantity;
          if (updatedQuantity < 0) {
            req.session.logedUser.cart = []; 
            await user.save();
          
            return res.redirect('/cart/:userid?notEnoughQuantity=true');
          }
    
          // Update the product's quantity in the database
          await Products.findByIdAndUpdate(product._id, { quantity: updatedQuantity, OutofStock: updatedQuantity === 0 });
        }

    const orderDetails = {
      productNames: validCartProducts.map((cartItem) => cartItem.product.name).join(', '),
      productImages: validCartProducts.map((cartItem) => cartItem.product.images)
    };

    // Render the order success page with user and order details
    res.render('successorder', {
      user,
      cartProducts: validCartProducts,
      orderDetails,
      totalPrice,
      userId,
      orderId: newOrder._id
    });

    // Clear the user's cart
    user.cart = [];
    await user.save();
    req.session.logedUser.cart = [];
// clear session
req.session.PriceAfterCoupon = [];
req.session.finalAmount = [];


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

//-------------------------------category ------------------------------------------------

// category

const category = async (req, res) => {
  try {
    const categoryName = req.query.categoryName;
    console.log("categoryname", categoryName);

    const cat = await categorySchema.find()

    // Use the categoryName as needed to fetch products for that category
    const products = await Products.find({ category: categoryName });

    res.render('category', { category: cat, categoryName, products });
  } catch (error) {
    console.error('Error listing products by category:', error);
    res.status(500).send('Error listing products by category');
  }
};

// cancelOrder
const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.logedUser._id;

  try {
    const user = await usermodel.findById(userId);
    const cancelOrder = await order.findById(orderId);

    if (!cancelOrder) {
      console.log("Order not found");
      return res.status(404).send("Error fetching data, order not found");
    }

    if (cancelOrder.status.trim().toLowerCase() === "pending") {
      console.log("Cancelling order...");
      cancelOrder.status = "cancelled";

      // Increment the product quantities in the database
      for (const productItem of cancelOrder.products) {
        const product = await Products.findById(productItem.product._id);
        console.log("Product", product);
        if (product) {
          product.quantity += productItem.quantity;
          product.OutofStock = false;
          await product.save();
        }
      }

      if (cancelOrder.payment.method === "credit-card") {
        const refundAmount = cancelOrder.totalPrice;

        // Create a refund wallet transaction
        const refundTransaction = {
          type: "credit",
          amount: refundAmount,
          description: "Refund for canceled order",
        };

        // Add the refund transaction to the user's wallet transactions
        user.wallet.transactions.push(refundTransaction);
        user.wallet.amount += refundAmount;
      }

      // Save changes to the user's wallet and the order
      await user.save();
      await cancelOrder.save();

      console.log("Order Status After:", cancelOrder.status);

      // Return a success message or redirect to a relevant page
      return res.redirect('/profile');
    } else {
      console.log("Order status is not pending");
      return res.status(400).send('Order status is not pending');
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).send('Internal server error');
  }
};

// bynow button click 
const buynow = async (req, res) => {
  const productId = req.params.productId; 
  const userId = req.session.logedUser._id;

  try {
    const user = await usermodel.findById(userId);

    const primaryAddress = user.addresses.find((address) => address.primary === true);

    // if (!primaryAddress) {
     
    //   return res.status(404).json({ error: "Primary address not found" });
    // }
    req.session.buynowprdt =  productId
   
    res.redirect('/buynowcheckoutpage');
  } catch (error) {
   
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// buynow checkout page 

const buynowcheckoutpage = async (req, res) => {
  try {
    if (!req.session.logedUser) {
      return res.redirect('/login');
    }

    const userId = req.session.logedUser._id;
    const productId = req.session.buynowprdt;
    const product = await Products.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const user = await usermodel.findById(userId);

    let primaryAddress = user.addresses.find((address) => address.primary === true);

    if (!primaryAddress && user.addresses.length > 0) {
      primaryAddress = user.addresses[0];
      primaryAddress.primary = true;
      await user.save();
    }

    // Check if the product has an offer and adjust the total price
    let totalPrice = product.offerPrice ? product.offerPrice * 1 : product.price * 1;

    // Check if a coupon has been applied
    const appliedCoupon = req.session.PriceAfterCoupon;
    if (appliedCoupon) {
      
      totalPrice -= appliedCoupon;
    }

    res.render('buyCheckout', {
      user,
      primaryAddress,
      product,
      totalPrice,
      discountAmount: appliedCoupon,
    });
    req.session.PriceAfterCoupon = []
  } catch (error) {
    console.error('Error rendering buyCheckout page:', error);
    res.status(500).send('Internal Server Error');
  }
};

 
// buysuccess page 
const buySuccess = async (req, res) => {
  try {
    const userId = req.session.logedUser._id;
    const productId = req.session.buynowprdt;
    const paymenttype = req.session.paymentMethod

    const user = await usermodel.findById(userId);
    const product = await Products.findById(productId);

    if (!user || !product) {
      return res.redirect('/');
    }

        // Decrease the product quantity by 1
        if (product.quantity > 0) {
          product.quantity -= 1;
        } else {
           return res.redirect('/cart/:userid?notEnoughQuantity=true')
        }
        await product.save();
    let totalPrice = product.price;
    // Check if a discount is applied
    const appliedDiscount = req.session.finalAmount 
    if (appliedDiscount) {
      totalPrice -= appliedDiscount;
    }

    const newOrder = new order({
      userId: userId,
      address: user.addresses[0]._id,
      products: [
        {
          product: product._id,
          quantity: 1,
          productImage: product.images[0],
        }
      ],
      totalPrice: totalPrice,
      payment: {
        method: paymenttype
    }
    });
    await newOrder.save();

    // Clear the session data for buynowprdt and finalAmount
    delete req.session.buynowprdt;
    delete req.session.finalAmount;

    res.render('bynowSuccess', { user, product, totalPrice });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};




// search product 
const searchprdt = async (req, res) => {
  const searchQuery = req.body.searchQuery;
  try {
    // Create a case-insensitive regex pattern
    const regexPattern = new RegExp(searchQuery, 'i');

    // Search for products matching the search query and are not out of stock
    const products = await Products.find({
      name: regexPattern,
      OutofStock: false, 
    });

    if (products.length === 0) {
      return res.render('searchprdt', { message: 'No matching products found.' });
    }

    res.render('searchprdt', { products });
  } catch (error) {
    console.error('Error searching for products:', error);
    res.status(500).send('Error searching for products');
  }
};

// logout
const logout = async (req, res) => {
  const varr = req.session.loggedUser
  req.session.destroy();
  console.log("dis", varr);
  res.redirect('/login')
}

// 404
const notfound = (req,res)=>{
  res.render('404')
}


const razorpay = new Razorpay({
  key_id: process.env.RAZORYPAY_KEY_ID,
  key_secret: process.env.RAZORYPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
      const { productName, productPrice } = req.body;
      console.log("prdt",productName, productPrice);
     const paymenttype = req.body.paymentMethod;
    //  console.log("jjjjjjay",paymenttype);
     req.session.paymentMethod = paymenttype

     //coupon amount
     const couponAmount = req.session.couponAfterPrice || 0;
     console.log("couponAmount",couponAmount);
     const productcheck = await Products.findOne({ name: productName });
     const producttotal = productcheck.price
     const cartItems = req.session.cartItems
     const checkoutTotal = req.session.checkouttotalPrice
     console.log("cartItems",cartItems);
     console.log("checkoutTotal",checkoutTotal);

      // Calculate the product price based on offer or regular price
      const price = productcheck.offerPrice ? productcheck.offerPrice : productcheck.price;

    // Ensure productPrice is in paise (multiply by 100)
    let amount = checkoutTotal * 100;
    req.session.couponhas = amount;

    if (couponAmount > 0) {
      amount = couponAmount * 100; 
      req.session.couponhas = amount;
    }

      if (paymenttype === 'credit-card') {
        // Check if the product has enough quantity
        const product = await Products.findOne({ name: productName });
        if (!product || product.quantity < 1) {
            return res.status(400).send({ success: false, msg: 'Product out of stock' });
        }
      }
      const options = {
          amount: req.session.couponhas,
          currency: 'INR',
          receipt: 'razoruser@gmail.com',
      };

      razorpay.orders.create(options, (err, order) => {
          if (!err) {
              res.status(200).send({
                  success: true,
                  msg: 'Order Created',
                  order_id: order.id,
                  amount: amount,
                  key_id: process.env.RAZORYPAY_KEY_ID,
                  product_name: productName,
                  description: `Payment for ${productName}`,
                  contact: '7907265303',
                  name: 'vishakh',
                  email: 'vishakhcs51@gmail.com',
              });
          } else {
              res.status(400).send({ success: false, msg: 'Something went wrong' });
          }
      });
  } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).send({ success: false, msg: 'Internal Server Error' });
  }
};

const buynowcreateOrder = async (req, res) => {
  try {
      const { productName, productPrice } = req.body;
      console.log("prdt",productName, productPrice);
     const paymenttype = req.body.paymentMethod;
     req.session.paymentMethod = paymenttype

     //coupon amount
     const couponAmount = req.session.finalAmount || 0;
     const productcheck = await Products.findOne({ name: productName });

      // Calculate the product price based on offer or regular price
      const price = productcheck.offerPrice ? productcheck.offerPrice : productcheck.price;

    // Ensure productPrice is in paise (multiply by 100)
    let amount = price * 100; 

    // If a coupon is applied, subtract the coupon amount from the product price
    if (couponAmount > 0) {
      amount -= couponAmount * 100; 
    }

      if (paymenttype === 'credit-card') {
        // Check if the product has enough quantity
        const product = await Products.findOne({ name: productName });
        if (!product || product.quantity < 1) {
            return res.status(400).send({ success: false, msg: 'Product out of stock' });
        }
      }

      const options = {
          amount: amount,
          currency: 'INR',
          receipt: 'razoruser@gmail.com',
      };

      razorpay.orders.create(options, (err, order) => {
          if (!err) {
              res.status(200).send({
                  success: true,
                  msg: 'Order Created',
                  order_id: order.id,
                  amount: amount,
                  key_id: process.env.RAZORYPAY_KEY_ID,
                  product_name: productName,
                  description: `Payment for ${productName}`,
                  contact: '7907265303',
                  name: 'ClasscSoul',
                  email: 'vishakhcs51@gmail.com',
              });
          } else {
              res.status(400).send({ success: false, msg: 'Something went wrong' });
          }
      });
  } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).send({ success: false, msg: 'Internal Server Error' });
  }
};


// generate invoice
const generateInvoice = async (req, res) => {
  const userId = req.params.userId;
  const orderId = req.params.orderId;

  try {
    const user = await usermodel.findById(userId);
    const Order = await order.findById(orderId).populate('products.product');

    if (!Order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

  // Prepare product data based on the order's products
const products = Order.products.map(productInfo => {
  const product = productInfo.product;
  const quantity = productInfo.quantity;
  return {
    quantity: quantity,
    description: product.name,
    "tax-rate": 0,
    price: product.price,
  };
});

// Calculate the total price as the sum of all product prices
const totalPrice = products.reduce((total, product) => {
  return total + product.price * product.quantity;
}, 0);

const logoUrl = 'https://th.bing.com/th/id/R.92dc42fac85a64207ba0b4673ef1de10?rik=aZtbHeXpctUoJg&riu=http%3a%2f%2fwww.morcoblinds.co.uk%2fsites%2fall%2fthemes%2fmorco%2fimages%2fclassic_logo.png&ehk=qBU2cByT682xt50LHl2z5E6qsKZxHerPZLxd4Fu2Dco%3d&risl=&pid=ImgRaw&r=0';

const invoiceData = {
  currency: 'INR',
  marginTop: 25,
  marginRight: 25,
  marginLeft: 25,
  marginBottom: 25,
  logo: logoUrl,
  sender: {
    company: 'Classic Soul E-commerce',
    address: '123 Main St, Trivandrum, Kerala, India',
    zip: '695411',
    city: 'Trivandrum',
    country: 'India',
  },
  client: {
    company: user.username,
    address: user.addresses[0].address,
    city: user.addresses[0].city, 
    country: user.addresses[0].country,
  },
  information: {
    date: new Date().toLocaleDateString(), 
    number: `INV-${orderId}`,
  },
  products: products,
  "bottom-notice": "Thank you for choosing ClassicSoul...Hope to see you again",
};

    // Create invoice
    easyinvoice.createInvoice(invoiceData, function (result) {
      // Send the PDF as a response for download
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(result.pdf, 'base64'));
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating the invoice.');
  }
};



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
  vieworder,
  returnOrder,
  profilepost,
  addAddresspost,
  addnewaddress,
  deleteAddressPost,
  checkout,
  setPrimaryAddress,
  orderSuccess,
  incrementQuantity,
  category,
  cancelOrder,
  changeEmail,
  logout,
  increaseCount,
  decreaseCount,
  ChangePassword,
  changePasswordPost,
  notfound,
  buynow,
  buynowcheckoutpage,
  buySuccess,
  searchprdt,
  createOrder,
  generateInvoice,
  inputRefferalCode,
  buynowcreateOrder,
  

};