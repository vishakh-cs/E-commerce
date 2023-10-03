const nodemailer = require('nodemailer');
const usermodel = require("../models/usermodel");
const Products = require("../models/productmodel")
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');

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
  
      // Create a new user object with the hashed password and save it to the database
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
      }, 3 * 60 * 1000); // 3 minutes in milliseconds
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
    const email = req.body.email; // Access the email property directly
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
      to: email, // Use the email variable directly
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
      // User not found, handle this case (e.g., return an error message)
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
      // Handle the case where the user is not found
      return res.status(404).send('User not found');
    }

    // Password reset successful, you might want to redirect the user to a login page
    return res.redirect('/login');
  } catch (error) {
    // Handle errors, log them, and send an appropriate response
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
        cart: [], 
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

    // Render the product list page with the fetched products
    res.render('home', { products }); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

const productview = async(req, res) => {
  try {
   
    const product = await Products.findById(req.params.productId);

    // Get the first image URL
    const firstImageUrl = product.images[0]; // Assuming images is an array of image URLs

    // Render the product view page and pass the product and firstImageUrl to the template
    res.render('productview', { product, firstImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


//<-------------------------------------------------- cart controll-------------------------------------------------->
const cart = async (req, res) => {
  try {
      // Check if req.session.logedUser exists
      if (!req.session.logedUser || !req.session.logedUser.cart) {
          return res.status(404).send('Cart not found');
      }

      // Fetch products from the database based on the user's cart items
      const userCart = req.session.logedUser.cart;
      const cartProducts = await Promise.all(userCart.map(async (cartItem) => {
          const product = await Products.findById(cartItem.productId);
          return {
              product,
              quantity: cartItem.quantity
          };
      }));

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

    // Check if the product is already in the cart
    const existingProductIndex = userCart.findIndex(item => item.productId.toString() === productId);

    if (existingProductIndex !== -1) {
      // If product already exists, increase its quantity
      userCart[existingProductIndex].quantity += 1;
    } else {
      // If product doesn't exist, add it to the cart with quantity 1
      userCart.push({
        productId: productId,
        quantity: 1
      });
    }

    // Update the user's cart in the session
    req.session.logedUser.cart = userCart;

    // Save the session to persist the changes
    req.session.save(err => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      return res.status(200).json({ message: 'Product added to cart', cart: userCart });
    });
    console.log("user cart ",userCart);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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

};