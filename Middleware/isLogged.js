const userModel = require('../controller/usercontroller');

const isLogged = async (req, res, next) => {
  try {
    const user = req.session.logedUser;

    if (!user) {
      return res.redirect('/login');
    }
    next();
  } catch (error) {
    console.error('Error during user logged-in check:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = isLogged;
