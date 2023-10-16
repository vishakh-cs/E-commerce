var createError = require('http-errors');
var express = require('express');
var path = require('path');
const session = require('express-session');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const nodemailer = require("nodemailer")
const mongoose = require('mongoose')
require('dotenv').config();
const nocache = require("nocache");


const PORT = process.env.PORT 

var AdminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var app = express();
app.use(nocache());


mongoose.connect("mongodb://localhost:27017/Ecommerce-Users",{
    useNewUrlParser: true,
  useUnifiedTopology: true,
})

.then(()=>{
    console.log("connected to database ");
})
.catch((error)=>{
    console.error("Something went wrong",error);
})

app.use(session({
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'/public')));

//middleware
app.use('/', AdminRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('404');
}).listen(PORT,()=>{
  console.log(`Server is running on port http://localhost:${PORT}`);
})

module.exports = app;
