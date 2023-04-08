// ------------------ REQUIREMENTS
const express = require("express");
const cookieParser = require('cookie-parser');

// ------------------ SETUP / MIDDLEWARE
const app = express();
app.use(cookieParser());
const PORT = 8080;

//sets the template engine as html with embbedded js (views/*.ejs)
app.set("view engine","ejs");

app.use(express.urlencoded({ extended: true })); //express middleware

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
Function returns user object if inputted email matches existing
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

/*
Function checks if inputted password exists in the database for valid user.
*/
const passExistCheck = (password) => {
  for (const userId in users) {
    const user = users[userId];
    if(user.password === password) {
      return user;
    }
  }
  return null;
}


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
  test: {
    id: "test",
    email: "test@test.com",
    password: "123",
  },
};

// ------------------ ROUTES/ENDPOINTS

//REGISTER Route GET
app.get("/register",(req,res)=> {
  const templateVars = {
    user: req.cookies["user_id"],
    urls: urlDatabase,
  };
  res.render("urls_register",templateVars);
});

//REGISTER Route POST
app.post("/register",(req,res) => {
  
  if(req.cookies["urls_id"]) {
    res.redirect("/urls");
  }

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
  };

  const user = users[generateID];
  console.log(user);
  //Set userid cookie
  res.cookie("user_id",user);
  //Redirect user to /urls page
  res.redirect("/urls");
});

app.get("/urls", (req,res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    urls: urlDatabase,
  };

  res.render("urls_index",templateVars); //pass first param as template page, and second param as object. Template accesses each of the keys in objet.
});

//LOGIN Route GET
app.get("/login", (req,res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    urls: urlDatabase,
  };

  if(!templateVars.user) {
    res.render("urls_login",templateVars);
  }
  
  res.redirect("/urls");
});

//LOGIN Route Post
app.post("/login",(req,res) => {
  const {email, password} = req.body;

  //checks if email and password inputs are empty strings.
  if (!email || !password) {
    return res.status(400).send('Invalid credentials');
  //If a user with that e-mail cannot be found, return a response with a 403 status code.
  } else if (!getUserByEmail(email)) {
    return res.status(403).send("User does not exist.");
    
  } else if (!passExistCheck(password)) {
    return res.status(403).send("Incorrect password. Please try again.");
  }

  const user = getUserByEmail(email); 
  res.cookie("user_id",user);
  res.redirect("/urls");
});

//LOGOUT Route POST
app.post("/logout",(req,res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
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

//separate urls route for each short url id
app.get("/urls/:id", (req,res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: req.cookies["user_id"]
  };
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

// Catch all route
app.use((req, res) => {
  res.status(404).send('Not found!');
});

// ------------------ LISTENER
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});