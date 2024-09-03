require("dotenv").config();
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("./routes/utils/DButils");
var cors = require('cors');
const axios = require('axios'); 
const user_utils = require("./routes/utils/user_utils");  // Adjust the path if necessary
const { getRecipeInformation, searchRecipe, getRecipeDetails } = require('./routes/utils/recipes_utils');

var app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(
  session({
    cookieName: "session",
    secret: "template",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
    cookie: {
      httpOnly: false,
      secure: false, // Ensure this matches your environment; for production, it should be true with HTTPS
    }
  })
);


app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const corsConfig = {
  origin: true,
  credentials: true
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

var port = process.env.PORT || "80";

const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth = require("./routes/auth");

// Set up route handling for user, recipes, and authentication routes
app.use("/users", user);
app.use("/recipes", recipes);
app.use("/auth", auth);

// Middleware to check session and user authentication
// Middleware to check session and user authentication
app.use(function (req, res, next) {
  if (req.session && req.session.username) {  // Use username instead of user_id
    DButils.execQuery("SELECT username FROM users")
      .then((users) => {
        if (users.find((x) => x.username === req.session.username)) {
          req.user_id = req.session.username;  // Set req.user_id to username
        }
        next();
      })
      .catch((error) => next(error));
  } else {
    next();
  }
});


// Endpoint to check server status
app.get("/alive", (req, res) => res.send("I'm alive"));

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// Middleware to clean up incoming URLs
app.use((req, res, next) => {
  req.url = req.url.trim(); // Remove leading/trailing whitespace
  next();
});



// Endpoint to get recipe details by ID
app.get('/api/recipes/:recipe_id/details', async (req, res) => {
  const { recipe_id } = req.params; // Extract recipe ID from URL parameters

  try {
    const recipeDetails = await getRecipeDetails(recipe_id); // Use the getRecipeDetails function
    res.json(recipeDetails); // Send the recipe details as JSON
  } catch (error) {
    console.error('Failed to fetch recipe details:', error.message);
    res.status(500).send({ message: 'Failed to fetch recipe details', success: false });
  }
});

// Endpoint to search for recipes
app.get('/api/recipes/search', async (req, res) => {
  try {
    const { query, cuisine, diet, intolerances, number } = req.query;

    const response = await axios.get(`${api_domain}/complexSearch`, {
      params: {
        query: query || '',
        cuisine: cuisine || '', 
        diet: diet || '',
        intolerances: intolerances || '',
        number: number || 5,
        apiKey: process.env.spooncular_apiKey
      }
    });
    console.log('API Key:', process.env.spooncular_apiKey); // Remove after verifying

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    res.status(500).send({ message: 'Failed to fetch recipes', success: false });
  }
});

// Endpoint to get random recipes
app.get('/api/recipes/random', async (req, res) => {
  try {
    const number = req.query.number || 1; // Optional: Specify the number of random recipes you want

    // Make a request to Spoonacular API to get random recipes
    const response = await axios.get(`${api_domain}/random`, {
      params: {
        number: number,
        apiKey: process.env.spooncular_apiKey
      }
    });

    res.json(response.data); // Send the random recipes data
  } catch (error) {
    console.error('Error fetching random recipes:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    res.status(500).send({ message: 'Failed to fetch random recipes', success: false });
  }
});

// Error handling middleware
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

// Handle server shutdown gracefully
process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});
