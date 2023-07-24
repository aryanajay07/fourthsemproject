// routes.js
require("dotenv").config();
const nodemailer=require("nodemailer");
const express = require("express");
const router = express.Router();
const connection = require("./db");
const { promisify } = require("util");
const jwt = require('jsonwebtoken');

const checkAdmin=require('./middleware/checkAdmin');
const authenticateToken=require('./middleware/authenticateToken');

// Route for rendering the home page
router.get('/index',(req,res)=>{
  res.redirect("/");
})
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});
router.get("/", (req, res) => {
  const query = "SELECT FoodName, ImageName FROM recipes where featured='yes' ";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error retrieving data from the database:", error);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.render("index", { data: results });
  });
});
//route to render recipe
router.get("/recipes/:foodName",authenticateToken, async (req, res) => {
  try {
    const foodName = req.params.foodName;
    const query =
      "SELECT * FROM recipes WHERE FoodName = ?";
    const queryPromise = promisify(connection.query).bind(connection);
    const results = await queryPromise(query, [foodName]);

    // Check if any results were found
    if (results.length === 0) {
      return res.status(404).send("Recipe not found");
    }

    // Render the 'recipe.hbs' template and pass the data
    res.render("recipe", { data: results[0] });
  } catch (error) {
    console.error("Error retrieving data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/dashboard", authenticateToken,checkAdmin, async (req, res) => {
  
  try {
    const message = req.query.message || null;
    // if User is logged in, render the dashboard
    const categories = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snacks"];
    const sql1 = "SELECT * FROM recipes where featured='yes'";
    const sql2 = "SELECT DISTINCT Type FROM recipes";

    const queryPromise1 = promisify(connection.query).bind(connection);
    const queryPromise2 = promisify(connection.query).bind(connection);

    const [result1, result2] = await Promise.all([
      queryPromise1(sql1),
      queryPromise2(sql2),
    ]);
    res.render("dashboard", { recipes: result1, categories: result2,message });
  } catch (error) {
    console.error("Error executing the queries:", error);
    res.status(500).send("An error occurred");
  }
});

router.get("/categories/:type", authenticateToken, async (req, res) => {
  try {
    const type = req.params.type;
    const query = "SELECT * FROM recipes WHERE Type = ?";
    const queryPromise = promisify(connection.query).bind(connection);
    const results = await queryPromise(query, [type]);

    // Check if any results were found
    if (results.length === 0) {
      return res.status(404).send("Category not found");
    }

    // Render the 'categories' template and pass the data
    res.render("categories", { data: results });
  } catch (error) {
    console.error("Error retrieving data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/adminDashboard", authenticateToken, (req, res) => {
  const sql1 = "SELECT * FROM users";
  const sql2 = "SELECT DISTINCT Type FROM recipes";
  connection.query(sql1, (err, result1) => {
    if (err) {
      console.error("Error executing the first query: " + err.stack);
      return res.status(500).send("An error occurred");
    }
    connection.query(sql2, (err, result2) => {
      if (err) {
        console.error("Error executing the second query: " + err.stack);
        return res.status(500).send("An error occurred");
      }
      res.render("adminDashboard", { users: result1, categories: result2 });
    });
  });
});
router.get('/forgot-password',(req,res)=>{
  res.render('forgot-password');
})

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  // Query the "users" table to check if the email exists
  connection.query(
    "SELECT id, email FROM users WHERE email = ?",
    [email],
    (error, results) => {
      if (error) {
        console.error("Error querying the database:", error);
        return res.render("forgot-password", { errorMessage: "Something went wrong, please try again later." });
      }

      if (results.length === 0) {
        // If the email doesn't exist, show an error message on the "Forgot Password" form
        return res.render("forgot-password", { errorMessage: "Email not found." });
      }

      const user = results[0];
      const userId = user.id;

      // Generate a reset token (you can use any method of your choice to generate a secure token)
      const resetToken = jwt.sign({ userId, email }, process.env.KEY, { expiresIn: "1h" });

      // Save the reset token and its expiration time
      const expirationTimeInSeconds = 3600; // 1 hour (1 hour = 60 seconds * 60 minutes)
      connection.query(
        "INSERT INTO password_reset_tokens (user_id, reset_token, expires_at) VALUES (?, ?, NOW() + INTERVAL ? SECOND)",
        [userId, resetToken, expirationTimeInSeconds],
        (error) => {
          if (error) {
            console.error("Error saving the reset token:", error);
            return res.render("forgot-password", { errorMessage: "Something went wrong, please try again later." });
          }
          // Send the reset password link via email
          const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
          sendResetEmail(email, resetLink);
          res.render("forgot-password", { message: "Password reset link sent to your email." });
        }
      );
    }
  );
});
// GET route for rendering the "Reset Password" page
router.get('/reset-password', (req, res) => {
  const token = req.query.token; // Extract the token from the query parameter
  // Verify and decode the token
  jwt.verify(token, process.env.KEY, (error, decodedToken) => {
    if (error) {
      console.error('Error verifying the reset token:', error);
      return res.status(401).send('Invalid or expired token.');
    }
    // Render the "Reset Password" page with the token included as a hidden input in the form
    res.render('reset-password', { token });
  });
});
router.post('/reset-password', (req, res) => {
  const newPassword = req.body.newPassword; // Assuming the new password is sent in the request body as { "newPassword": "your_new_password_here" }
  const token = req.query.token; // Retrieve the token from the query parameter
  console.log('Received token:', token);

  if(!token){
  return res.status(401).json({ error: 'No token provided.' });
}
const tokenString = token.split(' ')[1];

  // Verify and decode the token
  jwt.verify(tokenString, process.env.KEY, (error, decodedToken) => {
    if (error) {
      console.error('Error verifying the reset token:', error);
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    const userId = decodedToken.userId;// Adjust this to match the correct property in the decoded token.

    // Check if the token exists in the database and is not expired
    connection.query(
      'SELECT id FROM password_reset_tokens WHERE user_id = ? AND reset_token = ? AND expires_at >= NOW()',
      [userId, token],
      (error, results) => {
        if (error) {
          console.error('Error querying the database:', error);
          return res.status(500).json({ error: 'Something went wrong, please try again later.' });
        }

        if (results.length === 0) {
          // If the token is invalid or expired, show an error message
          return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        // Update the user's password in the database
        connection.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [newPassword, userId],
          (error) => {
            if (error) {
              console.error('Error updating the password:', error);
              return res.status(500).json({ error: 'Something went wrong, please try again later.' });
            }

            // Delete the used reset token from the database
            connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId], (error) => {
              if (error) {
                console.error('Error deleting the reset token:', error);
              }
              return res.json({ message: 'Password reset successfully.' });
            });
          }
        );
      }
    );
  });
});


//Method to send the email with the reset link using Nodemailer
function sendResetEmail(email, resetLink) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Replace with your email service provider (e.g., 'Gmail', 'Outlook', etc.)
    auth: {
      user: 'realajaryan@gmail.com',
      pass: 'oombzcphigvjglcx', 
    },
  });

  const mailOptions = {
    from: 'realajaryan@gmail.com', 
    to: email,
    subject: 'Password Reset Link',
    html: `<p>Click the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      // Handle the error appropriately, e.g., render an error message to the user
    } else {
      console.log('Email sent:', info.response);
      // Optionally, you can handle the success, e.g., render a success message to the user
    }
  });
}
module.exports = router;
