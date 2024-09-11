var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path is for searching a recipe
 */
router.get("/search", async (req, res, next) => {
  try {
    // Retrieve query parameters
    const recipeName = req.query.query || ''; // Updated parameter key to match frontend 'query'
    const cuisine = req.query.cuisine || ''; // Default to empty string if not provided
    const diet = req.query.diet || ''; // Default to empty string if not provided
    const intolerance = req.query.intolerances || ''; // Default to empty string if not provided
    const number = req.query.number || 5; // Default to 5 if not provided

    console.log('Query Parameters:', { recipeName, cuisine, diet, intolerance, number });

    // Call the search function
    const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
    
    // Send the results back to the client
    res.send(results);
  } catch (error) {
    // Handle errors
    console.error('Error in search endpoint:', error.message);
    next(error);
  }
});

/**
 * This path is returns a random recipe
 */
router.get("/random", async (req, res, next) => {
  try {
    const includeTags = req.query.includeTags || '';  // Optional include tags
    const excludeTags = req.query.excludeTags || '';  // Optional exclude tags
    const number = req.query.number || 1;  // Number of random recipes to return
    const randomRecipes = await recipes_utils.getRandomRecipes(number, includeTags, excludeTags);
    res.send(randomRecipes);
  } catch (error) {
    next(error);
  }
});


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId/fullDetails", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeFullDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a preview details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});



module.exports = router;

