require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const checkAdmin = (req, res, next) => {
    const token = req.cookies.token;

  if (!token) {
    // If no token is provided, proceed to the next middleware or route handler
    return next();
  }

  // Verify the token
  jwt.verify(token, process.env.KEY, (err, decoded) => {
    if (err) {
      // If the token is invalid, proceed to the next middleware or route handler
      return next();
    }

    // If the token is valid, redirect the user to the dashboard route
    const username = decoded.username;
    if(username==="admin"){
       res.redirect('/adminDashboard');
     }
    return next();
  });
};

module.exports = checkAdmin;
