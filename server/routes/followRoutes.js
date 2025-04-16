const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const User = require('../models/User');

// 🔐 Middleware to ensure user is logged in
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

router.use(requireAuth);

// ✅ Follow endpoint
// ✅ Follow endpoint (now saves both Followers & Following)
router.post('/follow', async (req, res) => {
    const { teacherId, studentId } = req.body;
    const follower = req.user;
  
    try {
      if (follower.role === 'user' && teacherId) {
        const teacher = await Teacher.findById(teacherId);
        const student = await User.findById(follower._id);
  
        if (!teacher || !student) return res.status(404).json({ message: 'Teacher or Student not found' });
  
        // Add to teacher's followers
        if (!teacher.Followers.includes(student._id)) {
          teacher.Followers.push(student._id);
          await teacher.save();
        }
  
        // Add to student's following
        if (!student.Following.includes(teacher._id)) {
          student.Following.push(teacher._id);
          await student.save();
        }
  
        return res.status(200).json({ message: 'Student followed teacher' });
      }
  
      if (follower.role === 'teacher' && studentId) {
        const student = await User.findById(studentId);
        const teacher = await Teacher.findById(follower._id);
  
        if (!teacher || !student) return res.status(404).json({ message: 'Teacher or Student not found' });
  
        // Add to student's followers
        if (!student.Followers.includes(teacher._id)) {
          student.Followers.push(teacher._id);
          await student.save();
        }
  
        // Add to teacher's following
        if (!teacher.Following.includes(student._id)) {
          teacher.Following.push(student._id);
          await teacher.save();
        }
  
        return res.status(200).json({ message: 'Teacher followed student' });
      }
  
      return res.status(400).json({ message: 'Invalid follow request' });
  
    } catch (err) {
      console.error('Follow error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  

// ✅ Unfollow endpoint
router.post('/unfollow', async (req, res) => {
    const { teacherId, studentId } = req.body;
    const follower = req.user;
  
    try {
      if (follower.role === 'user' && teacherId) {
        const teacher = await Teacher.findById(teacherId);
        const student = await User.findById(follower._id);
  
        if (!teacher || !student) return res.status(404).json({ message: 'Teacher or Student not found' });
  
        // Remove student from teacher's followers
        teacher.Followers = teacher.Followers.filter(id => id.toString() !== student._id.toString());
        await teacher.save();
  
        // Remove teacher from student's following
        student.Following = student.Following.filter(id => id.toString() !== teacher._id.toString());
        await student.save();
  
        return res.status(200).json({ message: 'Student unfollowed teacher' });
      }
  
      if (follower.role === 'teacher' && studentId) {
        const student = await User.findById(studentId);
        const teacher = await Teacher.findById(follower._id);
  
        if (!teacher || !student) return res.status(404).json({ message: 'Teacher or Student not found' });
  
        // Remove teacher from student's followers
        student.Followers = student.Followers.filter(id => id.toString() !== teacher._id.toString());
        await student.save();
  
        // Remove student from teacher's following
        teacher.Following = teacher.Following.filter(id => id.toString() !== student._id.toString());
        await teacher.save();
  
        return res.status(200).json({ message: 'Teacher unfollowed student' });
      }
  
      return res.status(400).json({ message: 'Invalid unfollow request' });
  
    } catch (err) {
      console.error('Unfollow error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  


// ✅ Search by email
router.get('/search', async (req, res) => {
  const { email, type } = req.query;

  if (!email || !type) {
    return res.status(400).json({ message: 'Email and type are required' });
  }

  try {
    const Model = type === 'teacher' ? Teacher : User;
    const person = await Model.findOne({ Email: email }).populate('Followers', 'FName LName Email');

    if (!person) {
      return res.status(404).json({ message: `${type} not found` });
    }

    res.status(200).json({ person });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

router.get('/followers', async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
  
    try {
      const Model = user.role === 'teacher' ? Teacher : User;
      const populated = await Model.findById(user._id).populate('Followers', 'FName LName Email');
  
      res.status(200).json({ followers: populated.Followers });
    } catch (err) {
      console.error('Get followers error:', err);
      res.status(500).json({ message: 'Error fetching followers' });
    }
  });


  router.get('/following', async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
  
    try {
      const Model = user.role === 'teacher' ? Teacher : User;
      const populated = await Model.findById(user._id).populate('Following', 'FName LName Email');
  
      res.status(200).json({ following: populated.Following });
    } catch (err) {
      console.error('Get following error:', err);
      res.status(500).json({ message: 'Error fetching following' });
    }
  });
    

module.exports = router;
