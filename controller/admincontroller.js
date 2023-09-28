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
      const product = await productmodel.findById(req.params.productId);
      if (!product) {
          return res.status(404).send('Product not found');
      }
      res.render('admin/editproducts', { product }); // Render the edit form with the product data
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
}
// Route to handle the form submission and update the product
const editproductspost = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Extract the updated data from the request body
    const { name, description, category, price, quantity, rating, offers } = req.body;

    // Check if a new image file was uploaded
    const updatedFields = {
        name,
        description,
        category,
        price,
        quantity,
        rating,
        offers,
    };

    // Check if a new image file was uploaded
    if (req.file) {
        const newImage = req.file.filename;
        updatedFields.images = [newImage]; // Update the images field with the new image filename
    }

    // Find the product by ID and update its fields
    await productmodel.findByIdAndUpdate(productId, updatedFields);

    // Redirect to the product list page or a success page
    res.redirect('/productmanagement'); // Replace with the appropriate URL
} catch (error) {
    console.error('Error updating product:', error);
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
  
      // Update the user's status to unblocked in the database
      await usermodel.findByIdAndUpdate(userId, { isblocked: false });
  
      // Redirect back to the User Management page after successful unblocking
      res.redirect('/user'); // Update the URL as needed
    } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).send('Error unblocking user');
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
    
}