
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


module.exports ={
    adminlogin,
    admindashboard,
    productmanagement,
    adminloginpost,
    
}