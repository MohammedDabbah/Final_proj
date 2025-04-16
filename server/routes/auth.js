const express = require('express');
const passport = require('passport');
const cors = require('cors');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const { generateFourDigitCode, sendEmail } = require('../config/nodemailer');
const { OAuth2Client } = require("google-auth-library");

const corsOptions = {
  origin: ['http://10.100.55.3:8081','http://localhost:8081'], // Allow requests from your Expo app's URL
  credentials: true, // Enable credentials (cookies)
};

const router = express.Router();
const verificationCodes = {}; // Temporary in-memory storage

const client = new OAuth2Client('460063962262-qk13u51b0gip8jlilrc2hpb64bte4gli.apps.googleusercontent.com');



router.use(cors(corsOptions));
// router.use(cors);
router.get('/Verification', async (req, res) => {
  try {
    const { mail } = req.query;
    console.log(mail)
    if (!mail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const code = generateFourDigitCode();
    verificationCodes[mail] = code;
    console.log(`Generated code for ${mail}: ${code}`);

    await sendEmail(mail, 'Email Verification', `Your verification code: ${code}`);
    res.status(200).send('Verification email sent');
  } catch (err) {
    console.error('Error in /Verification route:', err);
    res.status(500).send('Failed to send verification email');
  }
});


// Register Route
router.post('/register', async (req, res, next) => {
  const { FName, LName, Email, Password, code, role } = req.body;

  if (!FName || !LName || !Email || !Password || !code || !role) {
    return res.status(400).json({ error: 'All fields, including the verification code, are required.' });
  }

  try {
    // Check if the code matches the stored verification code
    if (!verificationCodes[Email] || `${verificationCodes[Email]}` !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const UserModel = role === 'teacher' ? Teacher : User;

    // Check if the email is already registered
    const existingUser = await UserModel.findOne({ Email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }



    //  Define newUser before calling req.login()
    const newUser = new UserModel({
      FName,
      LName,
      Email,
      Password, // Store the hashed password
      role, // ✅ this is stored in DB now
    });

    await newUser.save();

    // Remove verification code after successful registration
    delete verificationCodes[Email];

    //  Ensure `newUser` is properly defined before using req.login()
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Registration successful, but login failed.' });
      }
      return res.status(200).json({ message: 'User registered and logged in successfully!', user: newUser });
    });

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: 'Error registering user.', message: err.message });
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
router.post('/logout', (req, res) => {
  console.log("logout")
  req.logout(err => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/authenticated', (req, res) => {
  console.log(req.user);
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log('test-auth');
    return res.json({ user: req.user });
  }
  console.log('auth-failed')
  res.json({ user: null });
});





router.post("/google-login", async (req, res) => {
  console.log(req.body);
  const { idToken, role = "user" } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: '460063962262-qk13u51b0gip8jlilrc2hpb64bte4gli.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    const {
      email,
      name,
      picture,
      sub: googleId,
      given_name: firstName,
      family_name: lastName,
    } = payload;

    const Model = role === "teacher" ? Teacher : User;

    let user = await Model.findOne({ Email: email });

    if (!user) {
      user = await Model.create({
        FName: firstName,
        LName: lastName,
        Email: email,
        role,
      });
    }

    await user.save();

    req.login(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Session login failed" });
      }

      return res.status(200).json({ message: "Google login successful", user });
    });
  } catch (err) {
    console.error("Google login failed:", err);
    return res.status(401).json({ message: "Invalid Google token", error: err });
  }
});

module.exports = router;



// Profile Route
// router.get('/profile', (req, res) => {
//   if (!req.isAuthenticated()) {
//     return res.status(401).json({ message: 'You are not logged in' });
//   }

//   // Return the user's profile information
//   res.status(200).json({
//     FName: req.user.FName,
//     LName: req.user.LName,
//     Email: req.user.Email,
//     // Add any other details you want to include in the profile
//   });
// });