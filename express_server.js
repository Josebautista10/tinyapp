const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  })
);
app.set('view engine', 'ejs');
app.use(morgan('dev'));

const generateRandomString = () => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 1; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const findURL = (shortURL, urlDatabase) => {
  if (!urlDatabase[shortURL]) {
    return false;
  }
  return true;
};

const confirmUserID = (shortURL, req, urlDatabase) => {
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return false;
  }

  return true;
};

const checkEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

// in-memory database
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW'
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW'
  }
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: '1@1.com',
    password: '1'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

//registration page
app.get('/register', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.render('register', templateVars);
});

//send the user to users data-base
app.post('/register', (req, res) => {
  const randomID = generateRandomString();
  const hashPassword = bcrypt.hashSync(req.body.password, 10);

  if (!req.body.email || !req.body.password) {
    throw Error(
      'Error 400: Bad Request\nPlease enter a valid email address and password.'
    );
  }

  for (const account in users) {
    if (users[account].email === req.body.email) {
      throw Error('Error 400: Bad Request\nThat account already exists');
    }
  }

  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: hashPassword
  };

  req.session.user_id = randomID;
  res.redirect('/urls');
});

//gets the info from the login page
app.get('/login', (req, res) => {
  const templateVars = {
    user: null
  };
  res.render('login', templateVars);
});

// gets the username and stores it in cookies
app.post('/login', (req, res) => {
  const templateVars = {
    user: null
  };
  
  const email = req.body.email;
  const password = req.body.password;
  const user = checkEmail(email, users);

  if (!email || !password) {
    throw Error(
      'Error 400: Bad Request\nPlease enter a valid email address and password.'
    );
  }

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).render('login', templateVars);
  }

  req.session.user_id = user.id
  res.redirect('/urls');
});

//Logs the user out taking them to main page
app.post('/logout', (req, res) => {
  req.session.user_id = null
  res.redirect('/login');
});

// browse GET urls
app.get('/urls', (req, res) => {
  if (!req.session.user_id) {
    console.log("there was no user_id found");
    res.status(404).send('Please Login');
  }

  let newObj = {};
  for (const user in urlDatabase) {
    if (urlDatabase[user].userID === req.session.user_id) {
      newObj[user] = urlDatabase[user];
    }
  }

  const templateVars = {
    urls: newObj,
    user: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

//generates a key of random characters and redirects to '/urls/:shortURL'
app.post('/urls', (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect('/login');
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };

    res.redirect(`/urls/${shortURL}`);
  }
});

// browse GET new urls
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.render('urls_new', templateVars);
});

// displays the short and long url to user
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.redirect(404, '/urls');
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.redirect(403, '/urls');
  } else {
    const templateVariables = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: users[req.session.user_id]
    };

    res.render('urls_show', templateVariables);
  }
});

//redirects to longURL when clicking on shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).send('No URL was found, try again');
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//deletes the key value pair from database
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.redirect(404, 'back');
  } else if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.redirect(403, 'back');
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

//lets the user update the longURL
app.post('/urls/:shortURL/update', (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect('/urls');
});

//lets the user edit the URL
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/user.json', (req, res) => {
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
