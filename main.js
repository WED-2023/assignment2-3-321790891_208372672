// require("dotenv").config();
// //#region express configures
// var express = require("express");
// var path = require("path");
// var logger = require("morgan");
// const session = require("client-sessions");
// const DButils = require("./routes/utils/DButils");
// var cors = require('cors')

// var app = express();
// app.use(logger("dev")); //logger
// app.use(express.json()); // parse application/json
// app.use(
//   session({
//     cookieName: "session", // the cookie key name
//     //secret: process.env.COOKIE_SECRET, // the encryption key
//     secret: "template", // the encryption key
//     duration: 24 * 60 * 60 * 1000, // expired after 20 sec
//     activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
//     cookie: {
//       httpOnly: false,
//     }
//     //the session will be extended by activeDuration milliseconds
//   })
// );
// app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
// app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
// //local:
// app.use(express.static(path.join(__dirname, "dist")));
// //remote:
// // app.use(express.static(path.join(__dirname, '../assignment-3-3-basic/dist')));
// app.get("/",function(req,res)
// { 
//   //remote: 
//   // res.sendFile(path.join(__dirname, '../assignment-3-3-basic/dist/index.html'));
//   //local:
//   res.sendFile(__dirname+"/index.html");

// });

// // app.use(cors());
// // app.options("*", cors());

// const corsConfig = {
//   origin: true,
//   credentials: true
// };

// app.use(cors(corsConfig));
// app.options("*", cors(corsConfig));

// var port = process.env.PORT || "80"; //local=3000 remote=80
// //#endregion
// const user = require("./routes/user");
// const recipes = require("./routes/recipes");
// const auth = require("./routes/auth");


// //#region cookie middleware
// app.use(function (req, res, next) {
//   if (req.session && req.session.user_id) {
//     DButils.execQuery("SELECT user_id FROM users")
//       .then((users) => {
//         if (users.find((x) => x.user_id === req.session.user_id)) {
//           req.user_id = req.session.user_id;
//         }
//         next();
//       })
//       .catch((error) => next());
//   } else {
//     next();
//   }
// });
// //#endregion

// // ----> For cheking that our server is alive
// app.get("/alive", (req, res) => res.send("I'm alive"));

// // Routings
// app.use("/users", user);
// app.use("/recipes", recipes);
// app.use(auth);

// // Default router
// app.use(function (err, req, res, next) {
//   console.error(err);
//   res.status(err.status || 500).send({ message: err.message, success: false });
// });



// const server = app.listen(port, () => {
//   console.log(`Server listen on port ${port}`);
// });

// process.on("SIGINT", function () {
//   if (server) {
//     server.close(() => console.log("server closed"));
//   }
//   process.exit();
// });



require("dotenv").config();
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("./routes/utils/DButils");
var cors = require('cors');
const api_domain = "https://api.spoonacular.com/recipes"; // Add this line to define the API base URL
const axios = require('axios'); // Import axios
const userRouter = require("./routes/user"); // Import the users.js file
const { getRecipeInformation, searchRecipe,getRecipeDetails } = require('./routes/utils/recipes_utils'); // Import the functions

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
    }
  })
);
// Place the session middleware before routes

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

app.use("/users", user);
app.use("/recipes", recipes);
app.use("/auth", auth);
app.use(function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        next();
      })
      .catch((error) => next());
  } else {
    next();
  }
});


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

/// Correct route definition
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

// Add the new /api/recipes/search endpoint
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
      // Improved error logging
      console.error('Error fetching recipes:', error.message);
  }
});


// Endpoint to get random recipes
app.get('/api/recipes/random', async (req, res) => {
  try {
      // Optional: Specify the number of random recipes you want, default is 1
      const number = req.query.number || 1; 

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



app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});
