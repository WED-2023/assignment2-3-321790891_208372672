const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {

    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}



async function getRecipeDetails(recipe_id) {

    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}


async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
    const response = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeName || '',  // Corrected from 'query' to 'recipeName'
            cuisine: cuisine || '', 
            diet: diet || '',
            intolerances: intolerance || '',  // Corrected from 'intolerances' to 'intolerance'
            number: number || 5,
            apiKey: process.env.spooncular_apiKey
        }
    });

    return getRecipesPreview(response.data.results.map((element) => element.id), username);
}

async function getRandomRecipes(number, includeTags, excludeTags) {
    const response = await axios.get(`${api_domain}/random`, {
      params: {
        number: number,
        tags: includeTags,  // Tags that the recipe must have
        excludeIngredients: excludeTags,  // Tags that the recipe must NOT have
        apiKey: process.env.spooncular_apiKey
      }
    });
  
    return getRecipesPreview(response.data.recipes.map((recipe) => recipe.id));
}


async function getRecipesPreview(recipe_ids) {
    let recipes = [];
    for (let id of recipe_ids) {
        let recipeDetails = await getRecipeDetails(id);
        recipes.push(recipeDetails);
    }
    return recipes;
}


exports.getRecipeDetails = getRecipeDetails;
module.exports = {
    getRecipeInformation,
    getRecipeDetails,
    searchRecipe,
    getRandomRecipes,
    getRecipesPreview
};


