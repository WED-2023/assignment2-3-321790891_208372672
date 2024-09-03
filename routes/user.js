
// module.exports = router;
var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

router.use(async function (req, res, next) {
  console.log('Session Data:', req.session); // Log session data for debugging
  
  if (req.session && req.session.username) { // Use 'username' from session
    try {
      // Verify if the user exists in the database using the correct column
      const users = await DButils.execQuery("SELECT username FROM users");
      if (users.find((x) => x.username === req.session.username)) {
        req.user_id = req.session.username; // Set req.user_id to the session username or appropriate field
        return next(); // Proceed to the next middleware or route handler
      }
      res.sendStatus(401); // Send Unauthorized if username not found in the database
    } catch (err) {
      next(err); // Pass the error to the error handling middleware
    }
  } else {
    console.log('No session or user ID found, sending 401');
    res.sendStatus(401); // Unauthorized if session is missing or user is not authenticated
  }
});


/**
 * This path gets body with recipeId and saves this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const { recipeId } = req.body;

    // Validate the recipeId is a number
    if (!Number.isInteger(recipeId)) {
      return res.status(400).send({ message: 'Invalid recipe ID' });
    }

    await user_utils.markAsFavorite(user_id, recipeId);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    const recipes_id_array = recipes_id.map((element) => element.recipe_id); // Extract recipe IDs into an array

    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    
    if (!results.length) {
      return res.status(404).send({ message: 'No favorite recipes found' });
    }

    res.status(200).send(results);
  } catch (error) {
    next(error); 
  }
});


/**
 * Error handling middleware
 */
router.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).send({ message: err.message });
});

module.exports = router;

