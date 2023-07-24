const express = require('express');
const connection = require('./db'); // Assuming you already have the database connection setup

const router = express.Router();

// Route for handling recipe search
router.get('/', (req, res) => {
  const searchQuery = req.query.query; // Extract the search query from the URL query parameter
  // Assuming you are using MySQL with the 'mysql' module, the query might look like this:
  connection.query(
    'SELECT * FROM recipes WHERE FoodName LIKE ? OR Description LIKE ?',
    [`%${searchQuery}%`, `%${searchQuery}%`],
    (error, results) => {
      if (error) {
        console.error('Error performing the search:', error);
        return res.status(500).json({ error: 'Something went wrong, please try again later.' });
      }
      // Send the search results to the frontend
      res.render('search-results', { results, query: searchQuery });
    }
  );
});

module.exports = router;
