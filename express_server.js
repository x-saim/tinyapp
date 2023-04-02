const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

//set ejs as the view engine.
app.set("view engine","ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req,res) => {
  const templateVars = {urls: urlDatabase}; //passing an object
  res.render("urls_index",templateVars); //pass first param as template page, and second param as object. Template accesses each of the keys in objet.
});

// create new route containing json string of urlDatabase obj
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

// sample for creating a new route and adding some context with HTML.
app.get("/hello", (req,res) =>{
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});