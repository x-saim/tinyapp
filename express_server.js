// ------------------ REQUIREMENTS
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const {getUserByEmail,generateRandomString,urlsForUser} = require("./helpers");

// ------------------ SETUP / MIDDLEWARE
const app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2']
}));

const PORT = 8080;
app.use(morgan('dev'));
//sets the template engine as html with embbedded js (views/*.ejs)
app.set("view engine","ejs");

app.use(express.urlencoded({ extended: true })); //express middleware

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    hashPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "test@test.com",
    hashPassword: bcrypt.hashSync("123", 10)
  },
};

// ------------------ ROUTES/ENDPOINTS

app.get("/", (req,res) => {
  res.redirect("/urls");
});

//REGISTER Route GET
app.get("/register",(req,res)=> {
  const templateVars = {
    user: req.session.user_id,
    urls: urlDatabase,
  };

  if (!templateVars.user) {
    return res.render("urls_register",templateVars);
  }
  res.redirect("/urls");
});

//LOGIN Route GET
app.get("/login", (req,res) => {
  const templateVars = {
    user: req.session.user_id,
    urls: urlDatabase,
  };

  if (!templateVars.user) {
    return res.render("urls_login",templateVars);
  }

  res.redirect("/urls");
});

app.get("/urls", (req,res) => {
  if (!req.session.user_id) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Please log in or register to get started.`);
  }

  const loggedUserID = req.session.user_id["id"];
  const filterUser = urlsForUser(loggedUserID,urlDatabase);

  const templateVars = {
    user: req.session.user_id,
    urls: filterUser,
  };

  res.render("urls_index",templateVars); //pass first param as template page, and second param as object. Template accesses each of the keys in objet.
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  
  const templateVars = {
    user: req.session.user_id
  };

  res.render("urls_new",templateVars);
});

//separate urls route for each short url id
app.get("/urls/:id", (req,res) => {
  const id = req.params.id;
  const filterUser = urlsForUser(req.session.user_id["id"],urlDatabase);

  if (!req.session.user_id) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Access denied. Please log in or register to get started.`);
  }

  if (!urlDatabase[id]) {
    return res.status(403).send(`Error: ${res.statusCode} - ${res.statusMessage}. Shortened URL does not exist!\n`);
  }
  
  if (!filterUser[id]) {
    return res.status(403).send("Error: You do not have the rights to access this page.");
  }
  const templateVars = {
    id,
    longURL: urlDatabase[id]["longURL"],
    user: req.session.user_id
  };

  res.render("urls_show",templateVars);
});

//redirect short urls to long urls
app.get("/u/:id", (req,res) => {
  const id = req.params.id;
  const loadLongURL = urlDatabase[id]["longURL"];
  res.redirect(loadLongURL);
});

// create new route containing json string of urlDatabase obj
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

//REGISTER Route POST
app.post("/register",(req,res) => {
  
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  // check if email and password are empty strings.
  const email = req.body.email.trim();
  const hashPassword = bcrypt.hashSync(req.body.password, 10);

  if (!email || !hashPassword) {
    return res.status(400).send("Invalid credentials");

    //check if email has been used before.
  } else if (getUserByEmail(email,users)) {
    return res.status(400).send("Email already in use.");
  }

  const generateID = generateRandomString();

  //Add new user object to global users object
  users[generateID] = {
    id: generateID,
    email,
    hashPassword
  };
  
  const user = users[generateID];

  //set user_id cookie
  req.session.user_id = user;
  res.redirect("/urls");
});

//LOGIN Route Post
app.post("/login",(req,res) => {
  const {email, password} = req.body;
  const user = getUserByEmail(email,users);

  //checks if email and password inputs are empty strings.
  if (!email || !password) {
    return res.status(400).send('Invalid credentials.');
    //If a user with that e-mail cannot be found, return a response with a 403 status code.

  } else if (!user || !bcrypt.compareSync(password, user.hashPassword)) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Access denied. Invalid email or password.`);
  }

  req.session.user_id = user;
  res.redirect("/urls");
});

//LOGOUT Route POST
app.post("/logout",(req,res) => {
  req.session = null;
  res.redirect("/login");
});


app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. To create new shortened urls, please log in or register to get started.\n`);
  }
  let longURLBody = req.body["longURL"];
  if (!longURLBody.includes("http://") && !longURLBody.includes("https://")) {
    longURLBody = "https://" + longURLBody;
  }

  const urlID = generateRandomString();

  urlDatabase[urlID] = {
    longURL: longURLBody,
    userID: req.session.user_id["id"]
  };

  res.redirect(`/urls/${urlID}`); // redirect the client to the /urls/:id route for the newly created short URL
});


//EDIT --- POST route UPDATE a URL resource.
app.post("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const urlID = req.params.id;
  const url = urlDatabase[urlID];

  if (!user) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. You do not have the rights to send this request. Please log in or register to get started.\n`);
  } else if (!url) {
    return res.status(404).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Page does not exist.\n`);
  } else if (url["userID"] !== user.id) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. You do not have the rights to update this URL.\n`);
  } else {
    let updatedLongURL = req.body.longURL;
    //edge case: if user inputs url without http/https protocol
    if (!updatedLongURL.includes("http://") && !updatedLongURL.includes("https://")) {
      updatedLongURL = "https://" + updatedLongURL;
    }
    url["longURL"] = updatedLongURL;
    res.redirect("/urls");
  }
});

//DELETE --- POST route that DELETES a URL resource.
app.post("/urls/:id/delete",(req,res) => {
  const urlID = req.params.id;
  const user = req.session.user_id;

  if (!user) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. You do not have the rights to send this request. Please log in or register to get started.\n`);
  } else if (!urlDatabase[urlID]) {
    return res.status(404).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Page does not exist.\n`);

  } else if (urlDatabase[urlID]["userID"] !== user["id"]) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. You do not have the rights to delete this URL.\n`);
  } else {
    delete urlDatabase[urlID];
    console.log("Successfully deleted URL.");
    res.redirect("/urls");
  }
});

// Catch all route
app.use((req, res) => {
  res.status(404).send('Not found!');
});

// ------------------ LISTENER
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});