const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const generateRandomString = () => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 1; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// in-memory database
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// browse GET new urls
app.get('/urls/new', (req, res) => {
  let username = '';
  const templateVars = {
    urls: urlDatabase,
    username: req.headers.cookie ? req.headers.cookie.split('=')[1] : username
  };
  res.render('urls_new', templateVars);
});

// gets the username and stores it in cookies
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

//Logs the user out taking them to main page
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// browse GET urls
app.get('/urls', (req, res) => {
  let username = '';
  const templateVars = {
    urls: urlDatabase,
    username: req.headers.cookie ? req.headers.cookie.split('=')[1] : username
  };
  console.log('cookie', req.headers.cookie);
  res.render('urls_index', templateVars);
});

//generates a key of random characters and redirects to '/urls/:shortURL'
app.post('/urls', (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// displays the short and long url to user
app.get('/urls/:shortURL', (req, res) => {
  let username = '';
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.headers.cookie ? req.headers.cookie.split('=')[1] : username
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
