const productmodel = require('../models/productmodel')

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


const productmanagement = (req,res)=>{
    const products = [
        {
          id: 1,
          name: 'Product 1',
          price: 100,
          imageUrl: '/images/img 1.jpg', 
        },
        // Add more product objects as needed
      ];
    res.render('admin/productmanagement', { products });
};


//



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

module.exports ={
    adminlogin,
    admindashboard,
    productmanagement,
    adminloginpost,
    addproducts,
    addproductspost,
    
}