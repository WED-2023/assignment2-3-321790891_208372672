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


async function createNewRecipe(user_id, recipeDetails) {
    try {
        const {
            recipe_id,
            image,
            title,
            readyInMinutes,
            aggregateLikes,
            vegetarian,
            vegan,
            glutenFree,
            summary,
            analyzedInstructions,
            instructions,
            extendedIngredients,
            servings
        } = recipeDetails;

        console.log('User ID:', user_id);

        // Safely stringify JSON fields, defaulting to valid empty JSON arrays if undefined or empty
        let analyzedInstructionsJSON = JSON.stringify(analyzedInstructions || []);
        let extendedIngredientsJSON = JSON.stringify(extendedIngredients || []);

        // Log serialized JSON to ensure correctness
        console.log('Serialized analyzedInstructions:', analyzedInstructionsJSON);
        console.log('Serialized extendedIngredients:', extendedIngredientsJSON);

        // Construct the SQL query with parameterized values
        const query = `
        INSERT INTO user_recipe
        (user_id, recipe_id, image, title, readyInMinutes, aggregateLikes, vegetarian, vegan, glutenFree, summary, analyzedInstructions, instructions, extendedIngredients, servings)
        VALUES ('${user_id}', '${recipe_id}', '${image}', '${title}', ${readyInMinutes}, ${aggregateLikes}, ${vegetarian}, ${vegan}, ${glutenFree}, '${summary}', '${analyzedInstructions}', '${instructions}', '${extendedIngredients}', ${servings})
      `;
  

        const params = [
            user_id,
            recipe_id, // Corrected to use recipe_id from input
            image,
            title,
            readyInMinutes,
            aggregateLikes,
            vegetarian ? 1 : 0, // Store boolean as 0 or 1
            vegan ? 1 : 0,
            glutenFree ? 1 : 0,
            summary,
            analyzedInstructionsJSON, // Insert serialized JSON string
            instructions,
            extendedIngredientsJSON,  // Insert serialized JSON string
            servings
        ];

        // Execute the query with parameterized values
        await DButils.execQuery(query, params);
        console.log(`Successfully created recipe ${title} for user ${user_id}`);
    } catch (error) {
        console.error('Error creating new recipe:', error.message);
        throw error;
    }
}


exports.createNewRecipe = createNewRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
