// ------------------ REQUIREMENTS
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const moment = require("moment");
const methodOverride = require('method-override');
const {getUserByEmail,generateRandomString,urlsForUser} = require("./helpers");


// ------------------ SETUP / MIDDLEWARE
const app = express();

//override using a query value
app.use(methodOverride('_method'));

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
    visits: 0,
    uniqueVisitors: [],
    date: [moment().format('MMMM Do YYYY, h:mm:ss a')],
    timestamp: []
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    visits: 0,
    uniqueVisitors: [],
    date: [moment().format('MMMM Do YYYY, h:mm:ss a')],
    timestamp: []
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
  if (!req.session.user_id) {
    return res.redirect("/login");
  } else {
    return res.redirect("/urls");
  }
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

  console.log(filterUser);
  res.render("urls_index",templateVars); //pass first param as template page, and second param as object. Template accesses each of the keys in object.
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
  const url = urlDatabase[id];
  const filterUser = urlsForUser(req.session.user_id["id"], urlDatabase);

  if (!req.session.user_id) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Access denied. Please log in or register to get started.`);
  } else if (!url) {
    return res.status(403).send(`Error: ${res.statusCode} - ${res.statusMessage}. Shortened URL does not exist!\n`);
  } else if (!filterUser[id]) {
    return res.status(403).send("Error: You do not have the rights to access this page.");
  } else {

    const templateVars = {
      id,
      longURL: url["longURL"],
      visits: url["visits"],
      uniqueVisitorCount: url["uniqueVisitors"].length,
      timestamp: url["timestamp"],
      user: req.session.user_id
    };
    
    res.render("urls_show",templateVars);

  }
});

//redirect short urls to long urls
app.get("/u/:id", (req,res) => {
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send(`Error: ${res.statusCode} - ${res.statusMessage}. Shortened URL does not exist!\n`);
  } else {
    
    const userID = req.session.user_id;

    //if cookie exists and the object is not "tracking" the visitor's id then add it to the uniqueVisitor array.
    if (userID && !url["uniqueVisitors"].includes(userID.id)) {
      url["uniqueVisitors"].push(userID.id);
    }

    //update the visit count for visiting short URL
    url["visits"]++;

    url["timestamp"].push(moment().format('MMMM Do YYYY, h:mm:ss a'));
    const loadLongURL = urlDatabase[id]["longURL"];
    res.redirect(loadLongURL);
  }

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
    return res.status(400).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Invalid credentials.`);

    //check if email has been used before.
  } else if (getUserByEmail(email,users)) {
    return res.status(400).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Email already in use.`);
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
    userID: req.session.user_id["id"],
    visits: 0,
    uniqueVisitors: [],
    date: [],
    timestamp: []
  };

  //use moment module to set creation date.
  urlDatabase[urlID]["date"].push(moment().format('MMMM Do YYYY, h:mm:ss a'));

  res.redirect(`/urls/${urlID}`); // redirect the client to the /urls/:id route for the newly created short URL
});


//PUT --- route UPDATES a URL resource.
app.put("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const urlID = req.params.id;
  const url = urlDatabase[urlID];

  if (!user) {
    return res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Request denied. Please log in or register to get started.\n`);
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

//DELETE --- DELETES a URL resource.
app.delete("/urls/:id",(req,res) => {
  const urlID = req.params.id;
  const user = req.session.user_id;

  if (!user) {
    res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. You do not have the rights to send this request. Please log in or register to get started.\n`);

  } else if (!urlDatabase[urlID]) {
    res.status(404).send(`Status code: ${res.statusCode} - ${res.statusMessage}. Page does not exist.\n`);

  } else if (urlDatabase[urlID]["userID"] !== user["id"]) {
    res.status(403).send(`Status code: ${res.statusCode} - ${res.statusMessage}. You do not have the rights to delete this URL.\n`);

  } else {
    delete urlDatabase[urlID];
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