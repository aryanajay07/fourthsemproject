// auth.js
require("dotenv").config();
const secretKey=process.env.KEY;

const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticateToken=require('./middleware/authenticateToken');
const checkLogin= require('./middleware/checkLogin');
const bodyParser=require('body-parser');
const connection = require("./db");

router.get("/",checkLogin, (req, res) => {
  res.render("login");
});

router.post("/", checkLogin,(req, res) => {
  // ...
  const { username, password } = req.body;
    if(username==='admin' && password === 'admin'){
      const token = jwt.sign({ userId: 1, username: 'admin' }, secretKey);
    res.cookie('token', token);
      res.redirect('./adminDashboard');
    }
  // Query the users table to check if the username exists
  connection.query(
    "SELECT username,password FROM users WHERE username = ? AND password = ?",
    [username, password],
    (error, results) => {
      if (error) {
        console.error("Error querying the database:", error);
        return;
      }
      if (results.length === 0) {
        const errorMessage = "Invalid username or password";
        res.render("login", { errorMessage });
        return;
      }
    const user = results[0];
    const token = jwt.sign({ userId: user.id, username: user.username }, secretKey);
    res.cookie('token', token);
      res.redirect('./dashboard');
    }
  );
});

module.exports = router;
