const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const redis = require("redis");

// Create Redis client
let client = redis.createClient({
  url: 'redis://localhost:6379'  
});

// Handle Redis connection
client.connect().catch(console.error);

client.on("connect", function () {
  console.log("Connected to Redis...");
});

const port = 3000;
const app = express();

// Handlebars middleware
app.engine("handlebars", engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Method override middleware
app.use(methodOverride("_method"));

// Search page route
app.get("/", function (req, res) {
  res.render("searchusers");
});

// Search processing route
app.post("/user/search", async function (req, res, next) {
  let id = req.body.id;

  try {
    const obj = await client.hGetAll(id);  
    if (Object.keys(obj).length === 0) {
      res.render("searchusers", {
        error: "User does not exist",
      });
    } else {
      obj.id = id;
      res.render("details", {
        user: obj,
      });
    }
  } catch (err) {
    console.log(err);
    res.render("searchusers", {
      error: "Error fetching user data",
    });
  }
});

// Add user form route
app.get("/user/add", function (req, res) {
  res.render("adduser");
});

// Add user processing route
app.post("/user/add", async function (req, res) {
  let id = req.body.id;
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let email = req.body.email;
  let phone = req.body.phone;

  try {
    await client.hSet(id, "first_name", first_name, "last_name", last_name, "email", email, "phone", phone); 
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.render("adduser", {
      error: "Error saving user data",
    });
  }
});

// Delete user route
app.delete("/user/delete/:id", async function (req, res, next) {
  try {
    await client.del(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/", { error: "Error deleting user" });
  }
});

// Start server
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
