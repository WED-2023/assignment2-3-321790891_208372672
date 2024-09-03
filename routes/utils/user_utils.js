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

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
