const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  expectedAnswer: String, // Optional for open-ended/speech tasks
});

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['word', 'sentence'], required: true },
  skill: { type: String, enum: ['reading', 'writing', 'speech'], required: true },
  tasks: [taskSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  targetLevel: {
  type: String,
  enum: ['beginner', 'intermediate', 'advanced'],
  required: true,
},
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Activity', activitySchema);
