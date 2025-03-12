const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define User Schema
const UserSchema = new mongoose.Schema({
  FName: { type: String, required: true },
  LName: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  userLevel: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'professional'],// Enum values
    default: 'beginner',
  },
  assessLevel: {type: Boolean, required: true, default: false},
  unknownWords: [{ word: String, definition: String }],
});

// Hash Password Before Saving
UserSchema.pre('save', async function (next) {
    if (this.isModified('Password')) { // "Password" must match the schema field
      this.Password = await bcrypt.hash(this.Password, 10);
    }
    next();
  });
  

// Export the User model
module.exports = mongoose.model('User', UserSchema);
