const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')
const categoryModel = require("../models/categoryModel")
const orderModel = require('../models/orderModel')
const moment = require('moment');


// admin login get
const adminlogin = (req,res)=>{
  if(req.session.admin){
    return res.redirect('/admindashboard');
  }
    res.render('admin/adminlogin')
}

// admin login post

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
const admindashboard = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/adminlogin');
  }

  try {
    const orders = await orderModel.find({}).populate('products.product'); // Populate product information

    const salesData = [];
    for (const order of orders) {
      const user = await usermodel.findById(order.userId);
      if (user) {
        const formattedDate = order.orderDate.toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
    
        const products = [];
        for (const orderProduct of order.products) {
          const product = await productmodel.findById(orderProduct.product);
          if (product) {
            products.push({
              name: product.name,
              image: product.images, // Update this to match your actual property name
            });
          }
        }
    
        salesData.push({
          orderId: order._id,
          user: user.email,
          products, // Add products array
          totalAmount: order.totalPrice,
          date: formattedDate,
        });
      }
    }  
    res.render('admin/admindashboard', { salesData });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};


// getsales data 
const getSalesDataByDay = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const endDate = moment().endOf('day');

    const salesData = await orderModel.aggregate([
      {
        $match: {
          orderDate: {
            $gte: today.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' },
          },
          totalAmount: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

// sales by week
const getSalesDataByWeek = async (req, res) => {
  try {
    // Calculate the start and end of the current week
    const startOfWeek = moment().startOf('week');
    const endOfWeek = moment().endOf('week');

    const salesData = await orderModel.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfWeek.toDate(),
            $lte: endOfWeek.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' },
          },
          totalAmount: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.json(salesData);
  } catch (error) {
    console.error('Error fetching week sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};

//monthly revenue pie chart 
const salesdatapiechart = async (req, res) => {
  try {
    const salesData = await orderModel.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$orderDate' },
          },
          totalAmount: { $sum: '$totalPrice' },
        },
      },
    ]);

    const labels = []; 
    const data = [];  

    // Loop through the salesData and populate the labels and data arrays
    for (let i = 1; i <= 12; i++) {
      const monthData = salesData.find(item => item._id.month === i);
      labels.push(moment().month(i - 1).format('MMMM')); 
      data.push(monthData ? monthData.totalAmount : 0); 
    }

    res.json({ labels, data });
  } catch (error) {
    console.error('Error fetching monthly sales data:', error);
    res.status(500).send('Internal Server Error');
  }
};



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
    const { name, description, category, subcategory, price, quantity, rating, offers } = req.body;
    const images = req.files.map((file) => file.filename);

    // Calculate the discount amount
    const discountPercentage = parseFloat(offers); // Convert offers to a floating-point number
    const discountAmount = (discountPercentage / 100) * price;

    // Calculate the final price after discount
    const discountedPrice = price - discountAmount;

    // Create a new Product document based on the schema
    const newProduct = new productmodel({
      name,
      description,
      category,
      subcategory, 
      price: discountedPrice, // Set the discounted price
      quantity,
      rating,
      offers,
      images,
      croppedImage, // Include the cropped image
    });

    // Save the new product to the database
    await newProduct.save();

    res.redirect('/productmanagement');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product');
  }
};





const addproducts = async (req, res) => {
  try {
    // Fetch categories and subcategories to populate the dropdowns
    const categories = await categoryModel.find({});

    res.render('admin/addproducts', { categories });
  } catch (error) {
    console.error('Error rendering Add Product page:', error);
    res.status(500).send('Error rendering Add Product page');
  }
};



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
  let { name, description, category, price, quantity, rating, offers , offer } = req.body;
  
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
        offerPrice : offer,
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
        offerPrice : offer,
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

// category management

const categoryManagement = async (req, res) => {
  try {
    const { categoryName, categoryDescription, subcategoryName } = req.body;
    console.log("sub",subcategoryName);

    // Check if the category already exists
    const existingCategory = await categoryModel.findOne({ name: categoryName });

    if (existingCategory) {
      // If the category already exists, show a popup message
      res.send('<script>alert("Category already exists!"); window.location.href = "/categories";</script>');
    } else {
     
      const newCategory = new categoryModel({
        name: categoryName,
        description: categoryDescription,
        subcategory: subcategoryName, 
      });

      // Save the new category to the database
      await newCategory.save();
      res.redirect('/categories');
    }
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).send('Error creating category');
  }
};


// delete category 

const removeCategory = async (req,res)=>{
  try {
    const categoryId = req.params.id;

    await categoryModel.findByIdAndDelete(categoryId);

    // Redirect or send a response as needed
    res.redirect('/categories'); // Redirect to the category management page
} catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).send('Error deleting category');
}
}

// add subcategory

const addSubcategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const { subcategory } = req.body;

      // Find the category by ID
      const category = await categoryModel.findById(categoryId);

      if (!category) {
          return res.status(404).json({ error: 'Category not found' });
      }
      category.subcategories.push(subcategory);

      // Save the updated category
      await category.save();

      // Return a success response
      res.status(200).json({ message: 'Subcategory added successfully' });
  } catch (error) {
      console.error('Error adding subcategory:', error);
      res.status(500).json({ error: 'Failed to add subcategory' });
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

    //  regular expression to perform a case-insensitive search
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

    // Calculate the total price for each order and set it in the result
    // orderitems = orderitems.map(order => {
    //   const totalPrice = order.products.reduce((acc, product) => { return acc + (product.price * product.quantity)}, 0);
     
    //   return { ...order.toObject(), totalPrice };
    // });
    
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
    removeCategory,
    addSubcategory,
    orderManagement,
    updateOrderStatus,
    getSalesDataByDay,
    getSalesDataByWeek,
    salesdatapiechart,

}