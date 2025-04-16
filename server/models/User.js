const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define User Schema
const UserSchema = new mongoose.Schema({
  FName: { type: String, required: true },
  LName: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Password: { type: String},
  role: { type: String, default: 'teacher' }, // ✅ added
  userLevel: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced'],// Enum values
    default: 'beginner',
  },
  evaluate: {type: Boolean, required: true, default: false},
  unknownWords: [{ word: String, definition: String }],
  Followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }], // 👈 OPTIONAL
  Following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],

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
