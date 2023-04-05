const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
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

/*
Function checks if someone tries to register with an email that already exists in users object.
*/
const getUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }

  return null;
};

//set ejs as the view engine.
app.set("view engine","ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// helper function


app.use(express.urlencoded({ extended: true })); //express middleware

app.get("/", (req, res) => {
  res.send("Hello!");
});

//rendering register page
app.get("/register",(req,res)=> {
  res.render("login");
});

//assigns new user id to user upon registeration, appends to users object.
app.post("/register",(req,res) => {
   
  // check if email and password are empty strings.
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (!email || !password) {
    return res.status(400).send("Invalid credentials");

    //check if email has been used before.
  } else if (getUserByEmail(email)) {     
    return res.status(400).send("Email already in use.");
  }

  const generateID = generateRandomString();
  
  //Add new user object to global users object
  users[generateID] = {
    "id": generateID,
    "email":  req.body.email.trim(), 
    "password": req.body.password.trim()
  }
  const userID = users[generateID];
  

  //Set userid cookie
  res.cookie("user_id",userID)

  //Redirect user to /urls page
  res.redirect("/urls");
});

app.get("/urls", (req,res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    urls: urlDatabase,
  };
  //console.log(templateVars);
  res.render("urls_index",templateVars); //pass first param as template page, and second param as object. Template accesses each of the keys in objet.
});

//LOGIN Route Post
app.post("/login",(req,res) => {
  //res.cookie("username",req.body.username);
  res.redirect("/urls");
});

//LOGOUT Route POST
app.post("/logout",(req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_new",templateVars);
});

app.post("/urls", (req, res) => {
  //edge case: if user inputs url without http/https protocol
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
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: req.cookies["user_id"]
  }
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
  let updatedLongURL = req.body.longURL;
  
  //edge case: if user inputs url without http/https protocol
  if (!updatedLongURL.includes("http://") && !updatedLongURL.includes("https://")) {
    updatedLongURL = "https://" + updatedLongURL;
  }
  urlDatabase[id] = updatedLongURL;
  res.redirect("/urls");
});

//Add a POST route that removes a URL resource.
app.post("/urls/:id/delete",(req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


// create new route containing json string of urlDatabase obj
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});