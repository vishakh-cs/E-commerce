const productmodel = require('../models/productmodel')
const usermodel = require('../models/usermodel')
const categoryModel = require("../models/categoryModel")
const orderModel = require('../models/orderModel')
const moment = require('moment');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


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
  const predefinedAdminName = process.env.adminName;
  const predefinedAdminPassword = process.env.adminpassword;
  if (adminname == predefinedAdminName && adminpassword == predefinedAdminPassword) {
    req.session.admin = adminname;
    res.redirect('/admindashboard');
  } else {
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
              image: product.images,
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

// pdf saes report
const salesreportpdf = async (req, res) => {
  try {
    const startOfYear = moment().startOf('year');
    const endOfYear = moment().endOf('year');

    const salesData = await orderModel.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfYear.toDate(),
            $lte: endOfYear.toDate(),
          },
        },
      },
      {
        $unwind: '$products',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      {
        $lookup: {
          from: 'users', 
          localField: 'userId',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $project: {
          orderId: '$_id',
          orderedAddress: {
            address: { $arrayElemAt: ['$userData.addresses.address', 0] },
            city: { $arrayElemAt: ['$userData.addresses.city', 0] },
            state: { $arrayElemAt: ['$userData.addresses.state', 0] },
            pincode: { $arrayElemAt: ['$userData.addresses.pin', 0] },
            country: { $arrayElemAt: ['$userData.addresses.country', 0] },
            phone: { $arrayElemAt: ['$userData.addresses.phone', 0] },
          },
          productName: { $arrayElemAt: ['$productData.name', 0] },
          orderPrice: { $multiply: ['$products.quantity', { $arrayElemAt: ['$productData.price', 0] }],
        },
      },
  }]);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    // Pipe the PDF document to the response stream
    doc.pipe(res);

    // Add PDF content
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown(1);

    // Loop through the sales data and add it to the PDF document
    for (const orderData of salesData) {
      doc.text(`Order ID: ${orderData.orderId}`);
      doc.text(`Ordered Address: ${orderData.orderedAddress.address}`);
      doc.text(`Ordered City: ${orderData.orderedAddress.city}`);
      doc.text(`Ordered State: ${orderData.orderedAddress.state}`);
      doc.text(`Ordered Pincode: ${orderData.orderedAddress.pincode}`);
      doc.text(`Ordered Country: ${orderData.orderedAddress.country}`);
      doc.text(`Ordered Phone: ${orderData.orderedAddress.phone}`);
      doc.text(`Product Name: ${orderData.productName}`);
      doc.text(`Order Price: Rs. ${orderData.orderPrice}`);
      doc.moveDown(1); // Add some space between entries
    }
    // Finalize the PDF document
    doc.end();
  } catch (error) {
    console.error('Error generating yearly sales report PDF:', error);
    res.status(500).send('Internal Server Error');
  }
};
// generate Excel Report
const generateExcelReport = async (req, res) => {
  try {
    // Calculate the start and end of the current year
    const startOfYear = moment().startOf('year');
    const endOfYear = moment().endOf('year');

    const salesData = await orderModel.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfYear.toDate(),
            $lte: endOfYear.toDate(),
          },
        },
      },
      {
        $unwind: '$products',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $project: {
          orderId: '$_id',
          orderedAddress: {
            address: { $arrayElemAt: ['$userData.addresses.address', 0] },
            city: { $arrayElemAt: ['$userData.addresses.city', 0] },
            state: { $arrayElemAt: ['$userData.addresses.state', 0] },
            pincode: { $arrayElemAt: ['$userData.addresses.pin', 0] },
            country: { $arrayElemAt: ['$userData.addresses.country', 0] },
            phone: { $arrayElemAt: ['$userData.addresses.phone', 0] },
          },
          productName: { $arrayElemAt: ['$productData.name', 0] },
          orderPrice: { $multiply: ['$products.quantity', { $arrayElemAt: ['$productData.price', 0] }] },
        },
      },
    ]);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Yearly Sales Report');
    // Define columns and set headers
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId' },
      { header: 'Ordered Address', key: 'orderedAddress.address' },
      { header: 'Ordered City', key: 'orderedAddress.city' },
      { header: 'Ordered State', key: 'orderedAddress.state' },
      { header: 'Ordered Pincode', key: 'orderedAddress.pincode' },
      { header: 'Ordered Country', key: 'orderedAddress.country' },
      { header: 'Ordered Phone', key: 'orderedAddress.phone' },
      { header: 'Product Name', key: 'productName' },
      { header: 'Order Price', key: 'orderPrice' },
    ];
    // Add data rows
    for (const orderData of salesData) {
      worksheet.addRow({
        orderId: orderData.orderId,
        'orderedAddress.address': orderData.orderedAddress.address,
        'orderedAddress.city': orderData.orderedAddress.city,
        'orderedAddress.state': orderData.orderedAddress.state,
        'orderedAddress.pincode': orderData.orderedAddress.pincode,
        'orderedAddress.country': orderData.orderedAddress.country,
        'orderedAddress.phone': orderData.orderedAddress.phone,
        productName: orderData.productName,
        orderPrice: `Rs. ${orderData.orderPrice}`,
      });
    }

    const excelBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=yearly_sales_report.xlsx');
    res.send(excelBuffer);

    console.log('Excel report generated successfully');
  } catch (error) {
    console.error('Error generating Excel report:', error);
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
    const discountedPrice = price - discountAmount;
    const newProduct = new productmodel({
      name,
      description,
      category,
      subcategory, 
      price: discountedPrice, // Set the discounted price
      quantity,
      rating,
      offers,
      images, // Include the cropped image
    });

    // Save the new product to the database
    await newProduct.save();

    res.redirect('/productmanagement');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product');
  }
};


// add products
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



//  edit form for a specific product (render page)
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

//  update the product
const editproductspost = async (req, res) => {
  const productId = req.params.id;
  let { name, description, category, price, quantity, rating, offers , offer } = req.body;
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
        $push: { images: req.file.filename }, 
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
    const deletedProduct = await productmodel.findByIdAndRemove(productId);
    if (!deletedProduct) {
      return res.status(404).send('Product not found');
    }
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
    const existingCategory = await categoryModel.findOne({ name: categoryName });
    if (existingCategory) {
      res.send('<script>alert("Category already exists!"); window.location.href = "/categories";</script>');
    } else {
      const newCategory = new categoryModel({
        name: categoryName,
        description: categoryDescription,
        subcategory: subcategoryName, 
      });
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
    res.redirect('/categories'); 
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
      const category = await categoryModel.findById(categoryId);

      if (!category) {
          return res.status(404).json({ error: 'Category not found' });
      }
      category.subcategories.push(subcategory);
      await category.save();
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
      await usermodel.findByIdAndDelete(userId);
      res.redirect('/user'); 
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send('Error deleting user');
    }
  };

  const blockUser = async (req, res) => {
    try {
      const userId = req.params.id;
      await usermodel.findByIdAndUpdate(userId, { isblocked: true });
      res.redirect('/user'); 
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
    const searchQuery = req.body.search;
    const regex = new RegExp(searchQuery, 'i');
    const users = await usermodel.find({ username: regex });
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

const adminLogout =async (req, res) => {
  req.session.destroy();
  res.redirect('/adminlogin')
}


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
    salesreportpdf,
    generateExcelReport,
    adminLogout,

}