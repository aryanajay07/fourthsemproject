
const express = require("express");
const router = express.Router();
const bodyParser=require('body-parser');
const connection = require("./db");
const checkLogin= require('./middleware/checkLogin');


// Route for user signup
router.get("/",checkLogin,(req, res) => {
    res.render("signup");
  
  });
  
  router.post("/", (req, res) => {
    const { username, email, password } = req.body;
  
    // Check if the username already exists in the database
    connection.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (error, results) => {
        if (error) {
          console.error("Error querying the database:", error);
          return;
        }
        if (results.length > 0) {
          const errorMessage =
            "Username already exists. Please choose a different username.";
          res.render("signup", { errorMessage });
          return;
        }
        connection.query(
          "INSERT INTO users (username,email, password) VALUES (?, ?,?)",
          [username, email, password],
          (insertError, insertResult) => {
            if (insertError) {
              console.error(
                "Error inserting new user into the database:",
                insertError
              );
              return;
            }
            // User signup successful, redirect to the login page
            res.redirect("./dashboard");
          }
        );
      }
    );
  });
   
  module.exports = router;
  