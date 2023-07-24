require("dotenv").config();//to access env variables
const express = require("express"); 
const multer = require('multer');
const bodyParser = require("body-parser"); 
const cookieParser=require('cookie-parser');
const mysql = require("mysql");
const hbs = require("hbs");
const path = require("path");

const upload = multer({ dest: 'public/images' });
const routes = require("./routes"); 
const connection = require("./db");
const router=require('./auth');
const signuprouter=require('./signup');
const uploadRoutes = require('./newRecipe');
const searcgRouter =require('./search');
const app = express();
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));

app.use("/", routes);
app.use("/login",router);
app.use("/signup",signuprouter);
app.use('/addrecipes', uploadRoutes);
app.use('/search',searcgRouter);

// Setting the view engine to Handlebars (hbs)
app.set("view engine", "hbs");

// Defining the views directory
app.set("views", path.join(__dirname, "views"));
app.use(express.json());

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
