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
          // Assuming you have a MongoDB model called User
          const userUpdate = await User.updateOne(
            { _id: userData._id },
            { $unset: { otp: 1, otpExpirationTime: 1 } }
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
      return res.status(401).send('Incorrect OTP.');
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

const loginpost = async (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  try {
    const user = await usermodel.findOne({ username: name });

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = req.body.name;
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

const productview = (req, res) => {
    const productData = {
        name: 'Sample Product',
        description: 'This is a sample product description.',
        price: 19.99,
        imageUrl: '/images/img 1.jpg',
        details: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed et odio velit. ...',
        smallImages: [
            { url: '/images/img 1.jpg', alt: 'Small Image 1' },
            { url: '/images/img 1.jpg', alt: 'Small Image 2' },
            { url: '/images/img 1.jpg', alt: 'Small Image 3' },
        ],
    };

    res.render('productview', { product: productData });
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
};