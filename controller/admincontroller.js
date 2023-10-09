const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')
const categoryModel = require("../models/categoryModel")
const orderModel = require('../models/orderModel')


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

// admin dashboard
 const admindashboard = (req,res)=>{
res.render('admin/admindashboard')
 }

 // product management
 const productmanagement = async (req, res) => {
  try {
    const { sortByPrice } = req.query;
    const sortOptions = {
        lowToHigh: { price: 1 },
        highToLow: { price: -1 },
    };

    let sortOption = sortOptions.lowToHigh;

    if (sortOptions[sortByPrice]) {
        sortOption = sortOptions[sortByPrice];
    }
    const products = await productmodel.find().sort(sortOption);
    console.log('Products:', products);
    res.render('admin/productmanagement', { products });
} catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products');
}
};

// add product post 

const addproductspost = async (req, res) => {
  try {

    const { name, description, category, price, quantity, rating, offers } = req.body;

    
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
      images, 
    });

    // Save the new product to the database
    await newProduct.save();

    
    res.redirect('/productmanagement'); 
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

  const productId = req.params.id;
  const { name, description, category, price, quantity, rating, offers } = req.body;
  
    console.log('Received productId:', productId);
    console.log('Received name:', name);
    console.log('Received description:', description);
    console.log('Received category:', category);
    console.log('Received price:', price);
    console.log('Received quantity:', quantity);
    console.log('Received rating:', rating);
    console.log('Received offers:', offers);
  
  try {
    
    // Check if a new image file was uploaded
    if (req.file) {
      // If a file was uploaded, update the product in the database with the new image
      const updatedProduct = await productmodel.findByIdAndUpdate(productId, {
        name: name,
        description: description,
        category: category,
        price: price,
        quantity: quantity,
        rating: rating,
        offers: offers,
        $push: { images: req.file.filename }, // Use $push to add the new image filename to the existing images array
      },
      { new: true }
      );

      if (!updatedProduct) {
        return res.status(500).send('Error fetching update');
      }
    } else {
      // If no new image file was uploaded, update the product without modifying the images array
      const updatedProduct = await productmodel.findByIdAndUpdate(productId, {
        name: name,
        description: description,
        category: category,
        price: price,
        quantity: quantity,
        rating: rating,
        offers: offers,
      },
      { new: true }
      );

      if (!updatedProduct) {
        return res.status(500).send('Error fetching update');
      }
    }
    res.redirect('/productmanagement'); 
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Error updating product');
  }
};


// delete product
const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    // Find the product by ID and remove it from the database
    const deletedProduct = await productmodel.findByIdAndRemove(productId);

    if (!deletedProduct) {
      return res.status(404).send('Product not found');
    }

    // Redirect to the admin dashboard or any other page after successful deletion
    res.redirect('/productmanagement');
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Error deleting product');
  }
};


// category management
const category = async (req,res)=>{
  try {
  const categories = await categoryModel.find();
  res.render('admin/catagory', { categories });
} catch (error) {
  console.error('Error fetching categories:', error);
  res.status(500).send('Error fetching categories');
}
}

const categoryManagement = async (req, res) => {
  try {
    const { categoryName, categoryDescription } = req.body;

    // Create a new category document
    const newCategory = new categoryModel({
      name: categoryName,
      description: categoryDescription,
    });

    // Save the new category to the database
    await newCategory.save();

    // Redirect back to the Category Management page after creating the category
    res.redirect('/categories'); 
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).send('Error creating category');
  }
}

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

// order-Management - -------------------->

const orderManagement = async (req, res) => {
  try {
    let orderitems = await orderModel.find({});

    // Sort orders based on the selected sorting option
    if (req.query.sortBy === 'ascending') {
      orderitems.sort((a, b) => a.orderDate - b.orderDate);
    } else if (req.query.sortBy === 'descending') {
      orderitems.sort((a, b) => b.orderDate - a.orderDate);
    }

    res.render("admin/orderManagement", { orders: orderitems });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


// update the order status
const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  console.log('Received orderId:', orderId);
    console.log('Received status:', status);

  try {
      
      const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

      if (updatedOrder) {
          res.redirect('/adminOrder') 
      } else {
          res.status(404).json({ message: 'Order not found' });
      }
  } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Internal server error' });
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
    category,
    deleteProduct,
    categoryManagement,
    orderManagement,
    updateOrderStatus,
}