const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

/*
Function creates a string of random characters from a alphanumeric character string.
*/
const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; //62 characters
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};


//set ejs as the view engine.
app.set("view engine","ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true })); //express middleware

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req,res) => {
  const templateVars = {urls: urlDatabase}; //passing an object
  res.render("urls_index",templateVars); //pass first param as template page, and second param as object. Template accesses each of the keys in objet.
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  ///edge case: if user inputs url without http/https protocol
  let longURL = req.body["longURL"];
  if (!longURL.includes("http://") && !longURL.includes("https://")) {
    longURL = "https://" + longURL;
  }
  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`); // redirect the client to the /urls/:id route for the newly created short URL
  }
);

//separate urls for each short url id
app.get("/urls/:id", (req,res) => {
  const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show",templateVars);
});


//redirect short urls to long urls
app.get("/u/:id", (req,res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//a POST route that updates a URL resource
app.post("/urls/:id", (req, res) => {
  const id = req.params.id; //assignign ID from URL /urls/<%= id %> to var id.
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  console.log(urlDatabase);
  res.redirect("/urls");
});


//Add a POST route that removes a URL resource.
app.post("/urls/:id/delete",(req,res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
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