const mongoose = require('mongoose');

// Progress Schema
const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Writing Category
  writing: {
    wordPractice: {
      totalWords: { type: Number, default: 0 },
      correctWords: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      highScore: { type: Number, default: 0 }
    },
    sentencePractice: {
      totalSentences: { type: Number, default: 0 },
      correctSentences: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      highScore: { type: Number, default: 0 }
    }
  },
  // Reading Category
  reading: {
    wordReading: {
      totalWords: { type: Number, default: 0 },
      correctPronunciations: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 }
    },
    sentenceReading: {
      totalSentences: { type: Number, default: 0 },
      correctPronunciations: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 }
    }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', ProgressSchema);