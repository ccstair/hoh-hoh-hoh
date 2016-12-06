const path = require('path');
const wishlistController = require('./wishlist/wishlistController');
const itemController = require('./item/itemController');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;

module.exports = (app, express) => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser()); // read cookies (needed for auth)
  app.use(express.static(path.join(__dirname, '/../client')));
  app.use(express.static(path.join(__dirname, '/../client/app')));
  app.use(express.static(path.join(__dirname, '/../node_modules')));

  // required for passport
  app.use(session({
    secret: 'hohlife',
    resave: false,
    saveUninitialized: false
   }));
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions

  // requests for home page, with auth check
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true, // allow flash messages
  }));

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true, // allow flash messages
  }));

  passport.use('local-signup', new LocalStrategy(
    function(req, res, done) {
      User.findOne({ 'username': username }, (err, user) => {

        // if there are any errors, return the error
        if (err) return done(err);

        // check to see if theres already a user
        if (user) {
          return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
        } else {
          const newUser = new User();

          // set the user's local credentials
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);

          // save the user
          newUser.save(function(err) {
            if (err)
              throw err;
            return done(null, newUser);
          });
        }
      });
    }));

  app.get('/api/wishlist', wishlistController.wishlists.get);
  app.post('/api/wishlist', wishlistController.wishlists.post);
  app.post('/api/wishlist/rename', wishlistController.wishlists.rename);
  app.post('/api/wishlist/delete', wishlistController.wishlists.delete);

  // requests for items
  app.post('/api/item/get', itemController.items.get);
  app.post('/api/item', itemController.items.post);
  app.post('/api/item/rename', itemController.items.rename);
  app.post('/api/item/delete', itemController.items.delete);
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
