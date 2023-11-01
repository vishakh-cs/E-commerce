const usermodel = require('../models/usermodel')

const isUserBlocked = async (req, res, next) => {
    try {
      const userId = req.session.logedUser._id; 
  
      const user = await usermodel.findById(userId);
  
      if (user.isblocked) {
        // User is blocked, deny access
        return res.send('Your account is blocked. Please contact support.');
      }
  
      // User is not blocked, allow them to proceed
      next();
    } catch (error) {
      console.error('Error during user block check:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  

  module.exports = isUserBlocked;