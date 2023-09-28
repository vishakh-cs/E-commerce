const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')


// admin login get
const adminlogin = (req,res)=>{
    res.render('admin/adminlogin')
}


const adminloginpost = (req, res) => {
  const adminname = req.body.username
  const adminpassword = req.body.password
  const predefinedAdminName = 'admin';
  const predefinedAdminPassword = 'admin';

  console.log("Received adminname:", adminname);
  console.log("Received adminpassword:", adminpassword);

  if (adminname == predefinedAdminName && adminpassword == predefinedAdminPassword) {
    // Create a session to authenticate the admin
    req.session.admin = adminname;

    res.redirect('/admindashboard');
  } else {
    // Invalid credentials, display an error message
    res.send("Invalid admin credentials");
  }
}


 const admindashboard = (req,res)=>{
res.render('admin/admindashboard')
 }

 const productmanagement = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await productmodel.find();

    // Log the products and their image URLs for debugging
    console.log('Products:', products);

    // Render the 'admin/productmanagement' view with the products data
    res.render('admin/productmanagement', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products');
  }
};


const addproductspost = async (req, res) => {
  try {
    // Extract data from the request body
    const { name, description, category, price, quantity, rating, offers } = req.body;

    // Extract the file paths of uploaded images from req.files
    const images = req.files.map((file) => file.filename);
console.log('image:',images);
    // Create a new Product document based on the schema
    const newProduct = new productmodel({
      name,
      description,
      category,
      price,
      quantity,
      rating,
      offers,
      images, // Assign the extracted image filenames
    });

    // Save the new product to the database
    await newProduct.save();

    // Redirect to a success page or product listing page
    res.redirect('/productmanagement'); // Fixed the URL path
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product');
  }
};


const addproducts = (req,res)=>{
  res.render('admin/addproducts')
}

// update product 
// Route to display the edit form for a specific product
const editproducts = async (req, res) => {
  try {
      const productId = req.params.id;

      const product = await productmodel.findById(productId);

      if (!product) {
          return res.status(404).send('Product not found');
      }

      res.render('admin/editproducts', { product }); // Render the edit product page with the product data
  } catch (error) {
      console.error('Error editing product:', error);
      res.status(500).send('Error editing product');
  }
};

// Route to handle the form submission and update the product
// Route to handle the form submission and update the product
const editproductspost = async (req, res) => {
  try {
    const productId = req.params.id;

    // Extract updated data from the request body
    const { name, description, category, price, quantity, rating, offers } = req.body;

    // Check if a new image file was uploaded
    if (req.file) {
      // If a file was uploaded, update the product in the database with the new image
      await productmodel.findByIdAndUpdate(productId, {
        name,
        description,
        category,
        price,
        quantity,
        rating,
        offers,
        $push: { images: req.file.filename }, // Use $push to add the new image filename to the existing images array
        // Update other fields as needed
      });
    } else {
      await productmodel.findByIdAndUpdate(productId, {
        name,
        description,
        category,
        price,
        quantity,
        rating,
        offers,
      });
    }

    res.redirect('/productmanagement'); 
  } catch (error) {
    console.error('Error updating product:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      // You can send an error message or redirect to a page with error details here
      return res.status(400).send('Validation error: ' + error.message);
    }

    res.status(500).send('Error updating product');
  }
};



//user controll
const usermangement = async (req,res)=>{
 
    try {
      const users = await usermodel.find({ username: { $ne: req.session.admin } });
      res.render("admin/usermanagement", { users });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Error fetching user data');
    }
  };

  const edituser = async (req, res) => {
    try {
      const user = await usermodel.findById(req.params.id);
      res.render("admin/edituser", { user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).send("Error fetching user");
    }
  };

  const edituserpost = async (req, res) => {
    try {
      await usermodel.findByIdAndUpdate(req.params.id, {
        username: req.body.username,
        email: req.body.email
      });
      res.redirect("/user");
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).send("Error updating user");
    }
  };

  const deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Find the user by ID and delete it from the database
      await usermodel.findByIdAndDelete(userId);
  
      // Redirect back to the User Management page after successful deletion
      res.redirect('/user'); 
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send('Error deleting user');
    }
  };

  const blockUser = async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Update the user's status to blocked in the database
      await usermodel.findByIdAndUpdate(userId, { isblocked: true });
  
      // Redirect back to the User Management page after successful blocking
      res.redirect('/user'); // Update the URL as needed
    } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).send('Error blocking user');
    }
  };
  
  const unblockUser = async (req, res) => {
    try {
      const userId = req.params.id;
  
      await usermodel.findByIdAndUpdate(userId, { isblocked: false });
      res.redirect('/user');
    } catch (error) { // Add a catch block for error handling
      console.error('Error unblocking user:', error);
      res.status(500).send('Error unblocking user');
    }
};


// search user
const searchUsers = async (req, res) => {
  try {
    // Get the search query from the form
    const searchQuery = req.body.search;

    // Use a regular expression to perform a case-insensitive search
    const regex = new RegExp(searchQuery, 'i');

    // Find users whose username matches the search query
    const users = await usermodel.find({ username: regex });

    // Render the user management page with the search results
    res.render('admin/usermanagement', { users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).send('Error searching users');
  }
};
  

module.exports ={
    adminlogin,
    admindashboard,
    productmanagement,
    adminloginpost,
    addproducts,
    addproductspost,
    editproducts,
    editproductspost,
    usermangement,
    edituser,
    edituserpost,
    deleteUser,
    blockUser,
    unblockUser,
    searchUsers,
    
}