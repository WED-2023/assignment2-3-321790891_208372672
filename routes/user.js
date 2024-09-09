
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
        req.user_id = req.session.username; // Set req.user_id to the session username
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



// Correct the handler for adding favorites
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.username; // Extract user ID from session
    const { recipeId } = req.body; // Extract recipe ID from request body

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
// router.get('/favorites', async (req, res, next) => {
//   try {
    
//     console.log("dsdasdsadsad");

//     const user_id = req.session.user_id;
//     const recipes_id = await user_utils.getFavoriteRecipes(user_id);
//     const recipes_id_array = recipes_id.map((element) => element.recipe_id); // Extract recipe IDs into an array

//     // const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    
//     if (!results.length) {
//       return res.status(404).send({ message: 'No favorite recipes found' });
//     }
//     res.status(200).send(results);
//   } catch (error) {
//     next(error); 
//   }
// });
router.get('/favorites', async (req, res, next) => {
  try {
    console.log("Fetching favorite recipes for user:", req.session.user_id);

    const user_id = req.session.username;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    const recipes_id_array = recipes_id.map((element) => element.recipe_id); // Extract recipe IDs into an array

    // Print the recipes_id_array to the console
    console.log("Favorite Recipe IDs:", recipes_id_array);

    // Temporary: Send the array directly as the response
    res.status(200).send(recipes_id_array); // Respond with the array of recipe IDs
  } catch (error) {
    console.error('Error fetching favorite recipes:', error.message);
    next(error); 
  }
});




// // This path gets body with recipe details and saves it as a new recipe for the logged-in user
// router.post('/recipes', async (req, res, next) => {
//   try {
//     const user_id = req.session.username;
//     const {
//       recipe_id,
//       image,
//       title,
//       readyInMinutes,
//       aggregateLikes,
//       vegetarian,
//       vegan,
//       glutenFree,
//       summary,
//       analyzedInstructions,
//       instructions,
//       extendedIngredients,
//       servings
//     } = req.body;

//     // Validate required fields
//     if (!title || !instructions) {
//       return res.status(400).send({ message: 'Title and instructions are required' });
//     }

//     // Call the function to create a new recipe
//     await user_utils.createNewRecipe(user_id,{
//       recipe_id,
//       image,
//       title,
//       readyInMinutes,
//       aggregateLikes,
//       vegetarian,
//       vegan,
//       glutenFree,
//       summary,
//       analyzedInstructions,
//       instructions,
//       extendedIngredients,
//       servings
//     });

//     res.status(201).send("Recipe successfully created");
//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * Error handling middleware
//  */
// router.use((err, req, res, next) => {
//   console.error(`Error: ${err.message}`);
//   res.status(err.status || 500).send({ message: err.message });
// });

// This path gets body with recipe details and saves it as a new recipe for the logged-in user
router.post('/recipes', async (req, res, next) => {
  try {
    const username = req.session.username;  // Retrieve username from session
    console.log("Username:", username);
    const {
      image,
      title,
      readyInMinutes,
      aggregateLikes,
      vegetarian,
      vegan,
      glutenFree,
      summary,
      instructions,  // Step-by-step instructions (array)
      extendedIngredients,  // Array of ingredients
      servings
    } = req.body;

    // Validate required fields
    if (!title || !instructions || !extendedIngredients) {
      return res.status(400).send({ message: 'Title, instructions, and ingredients are required' });
    }

    // Call the function to create a new recipe
    const recipeId = await user_utils.createNewRecipe(username, {
      image,
      title,
      readyInMinutes,
      aggregateLikes,
      vegetarian,
      vegan,
      glutenFree,
      summary,
      servings
    });

    // After the recipe is created, insert ingredients and instructions
    await user_utils.insertIngredientsAndInstructions(recipeId, extendedIngredients, instructions);

    res.status(201).send("Recipe successfully created");
  } catch (error) {
    next(error);
  }
});

module.exports = router;

