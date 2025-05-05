const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['ai', 'teacher'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approved: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const AnswerSchema = new mongoose.Schema({
  itemId: String,
  studentAnswer: String,
  isCorrect: Boolean
}, { _id: false });

const ActivitySubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  studyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  answers: [AnswerSchema],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'completed'],
    default: 'draft'
  },
  score: {
    type: Number,
    default: 0
  },
  feedback: [FeedbackSchema],
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastEdited: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivitySubmission', ActivitySubmissionSchema);