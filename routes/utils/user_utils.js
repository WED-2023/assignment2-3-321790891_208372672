const DButils = require("./DButils");
async function markAsFavorite(user_username, recipe_id) {
    try {
        console.log("user:", user_username);
        // Use parameterized queries to prevent SQL injection
        await DButils.execQuery(
            `INSERT INTO favorites (user_username, recipe_id) VALUES ('${user_username}', ${recipe_id})`
          );
        console.log(`Successfully added recipe ${recipe_id} to favorites for user ${user_username}`);
    } catch (error) {
        // Handle potential duplicate key error or other insertion issues
        if (error.code === 'ER_DUP_ENTRY') {
            console.error(`Recipe ${recipe_id} is already marked as favorite for user ${user_username}`);
        } else {
            console.error('Error marking recipe as favorite:', error.message);
        }
        throw error; // Propagate error for further handling
    }
}

async function getFavoriteRecipes(user_id) {
    try {
        // Use parameterized queries to prevent SQL injection
        const recipes_id = await DButils.execQuery(`select recipe_id from favorites where user_username='${user_id}'`);
        return recipes_id;
    } catch (error) {
        console.error('Error fetching favorite recipes:', error.message);
        throw error; // Propagate error to the caller for further handling
    }
}

async function createNewRecipe(username, recipeDetails) {
    try {
        const {
            image,
            title,
            readyInMinutes,
            vegetarian,
            vegan,
            glutenFree,
            summary,
            servings
        } = recipeDetails;

        console.log('Username:', username);

        // Construct the SQL query with parameterized values
        const query = `
        INSERT INTO user_recipe (user_id, image, title, readyInMinutes, vegetarian, vegan, glutenFree, summary, servings)
        VALUES ('${username}', '${image}', '${title}', ${readyInMinutes}, ${vegetarian}, ${vegan}, ${glutenFree}, '${summary}', ${servings})
      `;

        const params = [
            username,
            image,
            title,
            readyInMinutes,
            vegetarian ? 1 : 0,  // Store boolean as 0 or 1
            vegan ? 1 : 0,
            glutenFree ? 1 : 0,
            summary,
            servings
        ];

        const result = await DButils.execQuery(query, params);

        // Get the ID of the newly created recipe
        const recipeId = result.insertId;
        console.log(`Successfully created recipe ${title} for user ${username} with recipe ID ${recipeId}`);

        return recipeId;  // Return the recipe ID to be used for ingredients and instructions
    } catch (error) {
        console.error('Error creating new recipe:', error.message);
        throw error;
    }    
}

// Function to handle inserting both ingredients and instructions
async function insertIngredientsAndInstructions(recipeId, ingredients, instructions) {
    try {
        // Insert ingredients
        await insertIngredients(recipeId, ingredients);

        // Insert instructions
        await insertInstructions(recipeId, instructions);

        console.log(`Successfully inserted ingredients and instructions for recipe ID ${recipeId}`);
    } catch (error) {
        console.error('Error inserting ingredients or instructions:', error.message);
        throw error;
    }
}

// Function to insert ingredients into the ingredients table
async function insertIngredients(recipeId, ingredients) {
    try {
        for (const ingredient of ingredients) {
            const { name, amount, unit } = ingredient;
            const ingredientQuery = `
                INSERT INTO ingredients (recipe_id, name, amount, unit)
                VALUES ('${recipeId}', '${name}', ${amount}, '${unit}')
            `;
            await DButils.execQuery(ingredientQuery);
        }
        console.log(`Successfully inserted ingredients for recipe ID ${recipeId}`);
    } catch (error) {
        console.error('Error inserting ingredients:', error.message);
        throw error;
    }
}

// Function to insert instructions into the instructions table
async function insertInstructions(recipeId, instructions) {
    try {
        for (const [index, instruction] of instructions.entries()) {
            const instructionQuery = `
                INSERT INTO instructions (recipe_id, step_number, description)
                VALUES ('${recipeId}', ${index + 1}, '${instruction.description}')
            `;
            await DButils.execQuery(instructionQuery);
        }
        console.log(`Successfully inserted instructions for recipe ID ${recipeId}`);
    } catch (error) {
        console.error('Error inserting instructions:', error.message);
        throw error;
    }
}

// Fetch recipes with ingredients and instructions for the logged-in user
async function getUserRecipes(username) {
    try {
      // Query to get all recipes for the specific user
      const recipeQuery = `SELECT * FROM user_recipe WHERE user_id = '${username}'`;
      const recipes = await DButils.execQuery(recipeQuery);
      
      // Check if any recipes exist for the user
      if (!recipes.length) {
        return [];  // Return an empty array if no recipes found
      }
  
      // Loop through each recipe and fetch ingredients and instructions
      for (const recipe of recipes) {
        const recipeId = recipe.recipe_id;
  
        // Fetch ingredients for the current recipe
        const ingredientsQuery = `SELECT name, amount, unit FROM ingredients WHERE recipe_id = ${recipeId}`;
        const ingredients = await DButils.execQuery(ingredientsQuery);
  
        // Fetch instructions for the current recipe
        const instructionsQuery = `SELECT step_number, description FROM instructions WHERE recipe_id = ${recipeId} ORDER BY step_number`;
        const instructions = await DButils.execQuery(instructionsQuery);
  
        // Attach ingredients and instructions to the recipe object
        recipe.ingredients = ingredients;
        recipe.instructions = instructions;
      }
  
      return recipes;  // Return recipes with ingredients and instructions
    } catch (error) {
      console.error('Error fetching user recipes with details:', error.message);
      throw error;
    }
  }
  
exports.getUserRecipes = getUserRecipes;
exports.createNewRecipe = createNewRecipe;
exports.insertIngredientsAndInstructions = insertIngredientsAndInstructions;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
