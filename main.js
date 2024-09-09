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
const recipe_utils = require("./routes/utils/recipes_utils");


// Set up route handling for user, recipes, and authentication routes
app.use("/users", user);
app.use("/recipes", recipes);
app.use("/auth", auth);

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


app.get('/mainPage', async (req, res, next) => {
  try {
    console.log("Fetching main page with random recipes for user:", req.session.username);

    // Number of random recipes to fetch
    const numberOfRecipes = 3;

    // Fetch the previews of 3 random recipes using recipe_utils
    const randomRecipes = await recipe_utils.getRandomRecipes(numberOfRecipes);

    // Respond with the array of random recipe previews
    res.status(200).send(randomRecipes);
  } catch (error) {
    console.error('Error fetching main page recipes:', error.message);
    next(error);
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
