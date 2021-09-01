const express = require('express');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();
const PORT = 8080;

app.use(cookieParser());
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
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
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
    user: users[req.cookies['user_id']]
  };
  res.render('register', templateVars);
});

//send the user to users data-base
app.post('/register', (req, res) => {
  const randomID = generateRandomString();

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
    password: req.body.password
  };

  res.cookie('user_id', randomID);
  res.redirect('/urls');
});

//gets the info from the login page
app.get('/login', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('login', templateVars);
});

// gets the username and stores it in cookies
app.post('/login', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  const email = req.body.email;
  const user = checkEmail(email, users);
  
  if (!req.body.email || !req.body.password) {
    throw Error(
      'Error 400: Bad Request\nPlease enter a valid email address and password.'
    );
  }
  
  if (user.email !== req.body.email || user.password !== req.body.password) {
    return res.status(400).render('login', templateVars);
  }
  
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

//Logs the user out taking them to main page
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// browse GET urls
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  console.log(users);
  console.log('cookie ====>', req.cookies['user_id']);
  res.render('urls_index', templateVars);
});

//generates a key of random characters and redirects to '/urls/:shortURL'
app.post('/urls', (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// browse GET new urls
app.get('/urls/new', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_new', templateVars);
});

// displays the short and long url to user
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

//gets the long url from database
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//deletes the key value pair from database
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//lets the user update the longURL
app.post('/urls/:shortURL/update', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.newURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

//lets the user edit the URL
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
