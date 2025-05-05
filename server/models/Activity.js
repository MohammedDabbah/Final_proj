// models/Activity.js
const mongoose = require('mongoose');

// Define a schema for the items in an activity
const ActivityItemSchema = new mongoose.Schema({
  id: String,
  type: String,
  text: String,
  word: String,
  imageUrl: String,
  definition: String
}, { _id: false }); // Disable automatic _id for subdocuments

const ActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['quiz', 'matching', 'fill-in']
  },
  quizType: {
    type: String,
    enum: ['reading', 'writing', null]
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  // Use the defined schema for items, not just any array
  items: [ActivityItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastEdited: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);