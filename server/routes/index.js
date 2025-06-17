const express = require('express');
const cors = require('cors');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const bcrypt = require('bcrypt');
const authRoutes = require('./auth');
const { generateFourDigitCode, sendEmail } = require('../config/nodemailer');

const router = express.Router();

const corsOptions = {
  origin: ['http://10.100.55.3:8081','http://localhost:8081'], // Allow requests from your Expo app's URL
  credentials: true, // Enable credentials (cookies)
};

router.use(cors(corsOptions));
// router.use(cors);

// Root Route
router.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Mount Auth Routes
router.use('/auth', authRoutes);

router.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    return res.status(200).send(req.user);
  } else {
    console.log('failed');
    return res.status(403).json({ error: 'Access denied. Please log in.' });
  }
});

router.post('/change-details', async (req, res) => {
  const { fName, lName, password, newPwd, role} = req.body;
  console.log(req.body);

  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'You are not authenticated.' });
  }

  if (!fName && !lName && !password && !newPwd && !role) {
    return res.status(400).json({ error: 'No fields to update provided.' });
  }

  try {
    const UserModel = role === 'teacher' ? Teacher : User;
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update full name if provided
    if (fName) user.FName = fName;
    if (lName) user.LName = lName;

    // Handle password update
    if (password && newPwd) {
      const isMatch = await bcrypt.compare(password, user.Password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }

      // const hashedPassword = await bcrypt.hash(newPwd, 10);
      user.Password = newPwd;
    }

    await user.save();

    res.status(200).json({ message: 'Details updated successfully.' });
  } catch (err) {
    console.error('Error updating details:', err);
    res.status(500).json({ error: 'An error occurred while updating details.' });
  }
});


const verificationCodes = {}; // Store verification codes temporarily

router.post('/forgot-password', async (req, res) => {
  const { email ,role} = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
     const UserModel = role === 'teacher' ? Teacher : User;
    const user = await UserModel.findOne({ Email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    // Generate a random verification code
    const verificationCode = generateFourDigitCode();
    verificationCodes[email] = verificationCode;

    // Send email with the verification code

    console.log(`Generated code for ${email}: ${verificationCode}`);

    await sendEmail(email, 'Email Verification', `Your verification code: ${verificationCode}`);
   
    res.status(200).json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error("Error sending verification email:", err);
    res.status(500).json({ error: "Error sending verification email" });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, verificationCode, newPassword ,role} = req.body;

  if (!email || !verificationCode || !newPassword || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the verification code matches
    if (`${verificationCodes[email]}` !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }
     const UserModel = role === 'teacher' ? Teacher : User;
    const user = await UserModel.findOne({ Email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = newPassword;

    // Save the updated user
    await user.save();

    // Remove the verification code after successful reset
    delete verificationCodes[email];

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Error resetting password" });
  }
});

router.post('/userLevel-update', async (req, res) => {
  try {
      const { user, score } = req.body; // Get user email & score
      console.log("📩 Received request:", req.body);

      // 🏆 Determine the user's level based on the average score
      let userLevel = "beginner";
      if (score >= 7) {
          userLevel = "advanced";
      } else if (score >= 4) {
          userLevel = "intermediate";
      }

      // ✅ Update User Level in MongoDB
      const updatedUser = await User.findOne({_id : user._id});

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found." });
      }

      updatedUser.userLevel = userLevel;
      updatedUser.evaluate = true;
      await updatedUser.save();

      console.log("✅ User Level Updated:", updatedUser);
      res.status(200).json({ message: "User level updated successfully", userLevel });

  } catch (error) {
      console.error("❌ Error updating user level:", error);
      res.status(500).json({ message: "Server error" });
  }
});


router.get('/unknown-words', async (req, res) => {
  const userId = req.user.id; // Ensure user is authenticated

  try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      res.status(200).json({ unknownWords: user.unknownWords });
  } catch (err) {
      res.status(500).json({ error: "Error fetching words", message: err.message });
  }
});

router.post('/unknown-words', async (req, res) => {
  const { unknownWords } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Avoid duplicates
    const existingWords = user.unknownWords || [];
    const newWords = unknownWords.filter(
      (wordObj) =>
        !existingWords.some(
          (existing) => existing.word.toLowerCase() === wordObj.word.toLowerCase()
        )
    );

    // Only update if there are new words
    if (newWords.length > 0) {
      user.unknownWords = [...existingWords, ...newWords];
      await user.save();
    }

    res.status(200).json({ message: "Words saved successfully!", added: newWords.length });
  } catch (err) {
    res.status(500).json({ error: "Error saving words", message: err.message });
  }
});


router.post("/update-unknown-words", async (req, res) => {
  const { unknownWords } = req.body;
  const userId = req.user?.id;

  if (!Array.isArray(unknownWords)) {
      return res.status(400).json({ error: "Invalid data format. Must be an array of objects {word, definition}." });
  }

  try {
      const user = await User.findById(userId);
      if (!user) {
          console.error("User not found.");
          return res.status(404).json({ error: "User not found." });
      }


      // Replace stored mistakes with the new list
      user.unknownWords = unknownWords;
      await user.save();

      console.log("Updated user mistakes successfully!");
      res.status(200).json({ message: "User mistakes updated successfully!" });
  } catch (err) {
      console.error("ERROR UPDATING USER MISTAKES:", err.stack);
      res.status(500).json({ error: "Error updating user mistakes", message: err.message });
  }
});






module.exports = router;
