const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const teacherSchema = new mongoose.Schema({
    FName: {type: String, required: true},
    LName: {type: String, required: true},
    Email: { type: String, required: true, unique: true },
    Password: { type: String},
    role: { type: String, default: 'teacher' }, // ✅ added
    Followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 👈 OPTIONAL
    Following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

});

teacherSchema.pre('save', async function(next) {
    if (this.isModified('Password')) { // "Password" must match the schema field
        this.Password = await bcrypt.hash(this.Password, 10);
    }
    next();
});


module.exports = mongoose.model('Teacher', teacherSchema);