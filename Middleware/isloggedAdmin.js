

const admin = require('../controller/admincontroller');

const isLoggedAdmin = async (req, res, next) => {
  try {
    const admin = req.session.admin;

    if (!admin) {
      // Redirect or handle the case where the user is not authenticated
      return res.redirect('/adminlogin');
    }

    // If the user is authenticated,  continue to the next middleware 
    next();
  } catch (error) {
    console.error('Error during user logged-in check:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = isLoggedAdmin;
