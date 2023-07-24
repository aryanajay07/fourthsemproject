const express = require('express');
const router = express.Router();
const fs = require('fs');
const connection = require('./db');
const bodyParser = require("body-parser"); 

const multer=require('multer');

const storage = multer.diskStorage({
    destination: 'public/images',
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });
  const upload = multer({ storage: storage });
  
  router.get('/',(req,res)=>{
    res.render('newRecipe');
  })

router.post('/', upload.single('image'), (req, res) => {
  // Access the uploaded image using req.file
  const uploadedImage = req.file;

  // Extract the recipe details from the request body
  const { foodName, type, ingredients, instructions,description } = req.body;
  const imageName = uploadedImage.originalname;

    connection.query(
        'INSERT INTO recipes (Type, FoodName, Ingredients, Instructions, ImageName,Description) VALUES (?, ?, ?, ?, ?,?)',
        [type, foodName, ingredients, instructions, imageName,description],
        (insertError, insertResult) => {
          if (insertError) {
            res.status(200).send(
              "Error inserting new recipe into the database:",
              insertError
            );
            return;
          }
          // Recipe added successfully to the database
        //   res.status(200).send('Recipe added successfully');
          res.redirect("/adminDashboard");
        }
      );
  });

module.exports = router;
