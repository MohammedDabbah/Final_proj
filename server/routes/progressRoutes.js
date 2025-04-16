// routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'You must be logged in to access this resource' });
};

// Get user's progress
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find progress or create if it doesn't exist
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
      await progress.save();
    }
    
    res.json({
      userLevel: req.user.userLevel,
      progress
    });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update word practice progress
router.post('/writing/wordPractice', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { correctWords, totalWords, score } = req.body;
    
    // Find progress or create if it doesn't exist
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }
    
    // Update progress
    progress.writing.wordPractice.gamesPlayed += 1;
    progress.writing.wordPractice.totalWords += totalWords || 0;
    progress.writing.wordPractice.correctWords += correctWords || 0;
    
    // Update high score if current score is higher
    if (score > progress.writing.wordPractice.highScore) {
      progress.writing.wordPractice.highScore = score;
    }
    
    progress.lastUpdated = Date.now();
    await progress.save();
    
    // Check if user should level up
    await checkAndUpdateUserLevel(userId);
    
    res.json({ message: 'Progress updated successfully' });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sentence practice progress
router.post('/writing/sentencePractice', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { correctSentences, totalSentences, score } = req.body;
    
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }
    
    progress.writing.sentencePractice.gamesPlayed += 1;
    progress.writing.sentencePractice.totalSentences += totalSentences || 0;
    progress.writing.sentencePractice.correctSentences += correctSentences || 0;
    
    if (score > progress.writing.sentencePractice.highScore) {
      progress.writing.sentencePractice.highScore = score;
    }
    
    progress.lastUpdated = Date.now();
    await progress.save();
    
    await checkAndUpdateUserLevel(userId);
    
    res.json({ message: 'Progress updated successfully' });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update word reading progress
router.post('/reading/wordReading', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { correctPronunciations, totalWords } = req.body;
    
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }
    
    progress.reading.wordReading.gamesPlayed += 1;
    progress.reading.wordReading.totalWords += totalWords || 0;
    progress.reading.wordReading.correctPronunciations += correctPronunciations || 0;
    
    progress.lastUpdated = Date.now();
    await progress.save();
    
    await checkAndUpdateUserLevel(userId);
    
    res.json({ message: 'Progress updated successfully' });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sentence reading progress
router.post('/reading/sentenceReading', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { correctPronunciations, totalSentences } = req.body;
    
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }
    
    progress.reading.sentenceReading.gamesPlayed += 1;
    progress.reading.sentenceReading.totalSentences += totalSentences || 0;
    progress.reading.sentenceReading.correctPronunciations += correctPronunciations || 0;
    
    progress.lastUpdated = Date.now();
    await progress.save();
    
    await checkAndUpdateUserLevel(userId);
    
    res.json({ message: 'Progress updated successfully' });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to check and update user level
async function checkAndUpdateUserLevel(userId) {
  try {
    const progress = await Progress.findOne({ userId });
    const user = await User.findById(userId);
    
    if (!progress || !user) return;
    
    // Calculate total correct percentage
    const writingTotal = progress.writing.wordPractice.totalWords + progress.writing.sentencePractice.totalSentences;
    const writingCorrect = progress.writing.wordPractice.correctWords + progress.writing.sentencePractice.correctSentences;
    
    const readingTotal = progress.reading.wordReading.totalWords + progress.reading.sentenceReading.totalSentences;
    const readingCorrect = progress.reading.wordReading.correctPronunciations + progress.reading.sentenceReading.correctPronunciations;
    
    // Calculate accuracy percentages
    const writingAccuracy = writingTotal > 0 ? (writingCorrect / writingTotal) * 100 : 0;
    const readingAccuracy = readingTotal > 0 ? (readingCorrect / readingTotal) * 100 : 0;
    
    // Simple level progression logic
    const totalGames = progress.writing.wordPractice.gamesPlayed + 
                      progress.writing.sentencePractice.gamesPlayed +
                      progress.reading.wordReading.gamesPlayed +
                      progress.reading.sentenceReading.gamesPlayed;
    
    // Update level based on games played and accuracy
    if (user.userLevel === 'beginner' && totalGames >= 10 && writingAccuracy >= 70 && readingAccuracy >= 70) {
      user.userLevel = 'intermediate';
      await user.save();
    } else if (user.userLevel === 'intermediate' && totalGames >= 25 && writingAccuracy >= 80 && readingAccuracy >= 80) {
      user.userLevel = 'advanced';
      await user.save();
    }
  } catch (err) {
    console.error('Error updating user level:', err);
  }
}

// routes/progressRoutes.js

router.get('/:studentId', isAuthenticated, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Optional: Only allow teachers to access this
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can view student progress' });
    }

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let progress = await Progress.findOne({ userId: studentId });
    if (!progress) {
      progress = new Progress({ userId: studentId });
      await progress.save();
    }

    res.json({
      userLevel: student.userLevel,
      progress
    });
  } catch (err) {
    console.error('Error fetching student progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;