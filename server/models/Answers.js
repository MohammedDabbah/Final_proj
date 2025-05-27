const mongoose = require('mongoose');

const taskResponseSchema = new mongoose.Schema({
  taskIndex: { type: Number, required: true },
  response: { type: String, required: true },
  feedback: { type: String },
});

const answerSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },

  responses: {
    type: [taskResponseSchema],
    validate: [arr => arr.length > 0, 'At least one task response is required.'],
  },

  submittedAt: { type: Date, default: Date.now },
});

answerSchema.index({ activityId: 1, studentId: 1 }, { unique: true }); // Prevent duplicate submissions

module.exports = mongoose.model('Answer', answerSchema);
