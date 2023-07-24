require("dotenv").config();
const secretKey=process.env.KEY;
const jsonwebtoken =require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user using JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.redirect('/login');
    }
    req.user = decoded;
    next();
  });
};

module.exports=authenticateToken;