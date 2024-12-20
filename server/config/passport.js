const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User'); // Replace with the correct path to your User model
const bcrypt = require('bcrypt');

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' }, // Match frontend field names
    async (email, password, done) => {
      try {
        const user = await User.findOne({ Email: email }); // Search for the user by email
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' }); // User not found
        }
        const isMatch = await bcrypt.compare(password, user.Password); // Compare hashed passwords
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' }); // Password mismatch
        }
        return done(null, user); // Successful authentication
      } catch (err) {
        return done(err); // Handle errors
      }
    }
  )
);

// Serialize and Deserialize User
passport.serializeUser((user, cb) => {
  cb(null, user.id); // Serialize the user ID into the session
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id); // Find the user by ID during deserialization
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

module.exports = passport;
