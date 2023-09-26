const nodemailer = require('nodemailer');
const usermodel = require("../models/usermodel");
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');

// signup get
const signup = (req, res) => {
    res.render('signup');
}

// sigup post
// signup post
const signupPost = async (req, res) => {
  try {
      const OTP = randomstring.generate({ length: 4, charset: 'numeric' });

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

      // Create a new user object and save it to the database
      const newUser = new usermodel({
          username: req.body.name,
          email: req.body.email,
          password: req.body.password,
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
      // Handle the case where user data is not found in the session
      return res.status(401).send('User data not found in the session.');
    }

    // Compare the entered OTP with the stored OTP from the session
    if (userData.otp === combinedOTP) {
      // OTP is correct; you can mark it as verified in the user's session
      userData.otpVerified = true;
      // Redirect or respond as needed for a successful OTP verification
      return res.redirect('/login'); // Redirect to the login page or any other destination
    } else {
      // Incorrect OTP; handle this case appropriately
      return res.status(401).send('Incorrect OTP.');
    }
  } catch (error) {
    // Handle errors if any occur during the OTP verification process
    console.error('Error verifying OTP:', error);
    return res.status(500).send('Error verifying OTP.');
  }
};

// login get
const login = (req, res) => {
    res.render('login');
}

const forgotpassword = (req, res) => {
    res.render('forgotpassword');
}

// home
const home = (req, res) => {
    const products = [
        { name: 'Product 1', price: 20, imageUrl: '/images/img 10.jpg' },
        { name: 'Product 2', price: 25, imageUrl: '/images/img 1.jpg' },
        { name: 'Product 3', price: 30, imageUrl: '/images/HWPcgAhejy9XEm8iZzFYfZSU.webp' },
        { name: 'Product 4', price: 30, imageUrl: '/images/img 10.jpg' },
    ];

    res.render('home', { products });
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
};