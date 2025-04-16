const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // or Teacher if needed

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ Email: email });

    if (!user) {
      // Create new user if not found
      user = new User({
        FName: profile.name.givenName,
        LName: profile.name.familyName,
        Email: email,
        Password: 'GOOGLE-OAUTH', // dummy (you can skip login w/ password)
        role: 'user',
      });
      await user.save();
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
