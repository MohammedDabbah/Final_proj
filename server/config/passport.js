const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User'); // Replace with the correct path to your User model
const bcrypt = require('bcrypt');
const Teacher = require('../models/Teacher');

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true, // 👈 needed to access req.body.role
    },
    async (req, email, password, done) => {
      const { role } = req.body;

      try {
        const Model = role === 'teacher' ? require('../models/Teacher') : require('../models/User');
        const user = await Model.findOne({ Email: email });

        if (!user) return done(null, false, { message: 'Incorrect email.' });

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });

        user.role = role; // 👈 manually attach role for session usage
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);



// Serialize and Deserialize User
passport.serializeUser((user, done) => {
  done(null, { id: user._id, role: user.role }); // ✅ store both
});


passport.deserializeUser(async ({ id, role }, done) => {
  try {
    const Model = role === 'teacher' ? require('../models/Teacher') : require('../models/User');
    const user = await Model.findById(id);
    return done(null, user || false);
  } catch (err) {
    return done(err);
  }
});






module.exports = passport;