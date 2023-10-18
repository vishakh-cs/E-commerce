const userModel = require('../controller/usercontroller');

const isLogged = async (req, res, next) => {
  try {
    const user = req.session.logedUser;

    if (!user) {
      // Redirect or handle the case where the user is not authenticated
      return res.status(401).send('User not authenticated');
    }

    // If the user is authenticated,  continue to the next middleware 
    next();
  } catch (error) {
    console.error('Error during user logged-in check:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = isLogged;
