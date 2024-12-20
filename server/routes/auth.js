const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    const { FName, LName, Email, Password } = req.body;
  
    if (!FName || !LName || !Email || !Password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
  
    try {
      const user = new User({ FName, LName, Email, Password });
      await user.save();
      res.status(200).json({ message: 'User registered successfully!' });
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).json({ error: 'Email already exists.' });
      } else {
        res.status(500).json({ error: 'Error registering user.', message: err.message });
      }
    }
  });
  

// Login Route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (!user) {
        console.log('Authentication failed:', info);
        return res.status(400).json({ message: info?.message || 'Invalid credentials' });
      }
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }
        return res.status(200).json({ message: 'Login successful', user });
      });
    })(req, res, next);
  });
  

// Logout Route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
