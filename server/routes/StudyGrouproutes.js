const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Teacher = require('../models/Teacher');

// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

router.use(requireAuth);

// Create a new study group (teacher only)
router.post('/', async (req, res) => {
  try {
    // Verify the user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create study groups' });
    }

    const { name, description, isPublic } = req.body;
    
    const studyGroup = new StudyGroup({
      name,
      description,
      teacher: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await studyGroup.save();
    
    res.status(201).json({ 
      message: 'Study group created successfully', 
      studyGroup 
    });
  } catch (err) {
    console.error('Error creating study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all study groups for a teacher
router.get('/teacher', async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studyGroups = await StudyGroup.find({ teacher: req.user._id })
      .populate('activities', 'name type')
      .populate('students', 'FName LName Email');
    
    res.status(200).json(studyGroups);
  } catch (err) {
    console.error('Error fetching teacher study groups:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get available study groups for a student (based on teachers they follow)
router.get('/available', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await User.findById(req.user._id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find study groups where:
    // 1. The teacher is someone the student follows
    // 2. The study group is public OR the student is already a member
    const availableGroups = await StudyGroup.find({
      $or: [
        { 
          teacher: { $in: student.Following },
          isPublic: true
        },
        {
          students: req.user._id
        }
      ]
    })
    .populate('teacher', 'FName LName Email')
    .populate('activities', 'name type');
    
    res.status(200).json(availableGroups);
  } catch (err) {
    console.error('Error fetching available study groups:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get enrolled study groups for a student
router.get('/enrolled', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrolledGroups = await StudyGroup.find({
      students: req.user._id
    })
    .populate('teacher', 'FName LName Email')
    .populate('activities', 'name type');
    
    res.status(200).json(enrolledGroups);
  } catch (err) {
    console.error('Error fetching enrolled study groups:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get study group by ID
router.get('/:id', async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id)
      .populate('teacher', 'FName LName Email')
      .populate('students', 'FName LName Email')
      .populate('activities');
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Check permissions
    const isTeacher = req.user.role === 'teacher' && 
                     studyGroup.teacher._id.toString() === req.user._id.toString();
    const isStudent = req.user.role === 'user' && 
                     studyGroup.students.some(s => s._id.toString() === req.user._id.toString());

    if (!isTeacher && !isStudent && !studyGroup.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.status(200).json(studyGroup);
  } catch (err) {
    console.error('Error fetching study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update study group (teacher only)
router.put('/:id', async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Verify ownership
    if (req.user.role !== 'teacher' || studyGroup.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this study group' });
    }

    const { name, description, isPublic } = req.body;
    
    if (name) studyGroup.name = name;
    if (description !== undefined) studyGroup.description = description;
    if (isPublic !== undefined) studyGroup.isPublic = isPublic;
    
    studyGroup.lastEdited = Date.now();
    
    await studyGroup.save();
    
    res.status(200).json({ 
      message: 'Study group updated successfully', 
      studyGroup 
    });
  } catch (err) {
    console.error('Error updating study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add activity to study group (teacher only)
router.post('/:id/activities', async (req, res) => {
  try {
    const { activityId } = req.body;
    
    if (!activityId) {
      return res.status(400).json({ message: 'Activity ID is required' });
    }
    
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Verify ownership
    if (req.user.role !== 'teacher' || studyGroup.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this study group' });
    }
    
    // Verify the activity exists and belongs to this teacher
    const activity = await Activity.findOne({ 
      _id: activityId,
      teacher: req.user._id
    });
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found or not owned by this teacher' });
    }
    
    // Check if activity is already in the group
    if (studyGroup.activities.includes(activityId)) {
      return res.status(400).json({ message: 'Activity already added to this group' });
    }
    
    studyGroup.activities.push(activityId);
    studyGroup.lastEdited = Date.now();
    
    await studyGroup.save();
    
    res.status(200).json({ 
      message: 'Activity added to study group', 
      studyGroup 
    });
  } catch (err) {
    console.error('Error adding activity to study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove activity from study group (teacher only)
router.delete('/:id/activities/:activityId', async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Verify ownership
    if (req.user.role !== 'teacher' || studyGroup.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this study group' });
    }
    
    // Remove activity from group
    studyGroup.activities = studyGroup.activities.filter(
      actId => actId.toString() !== req.params.activityId
    );
    
    studyGroup.lastEdited = Date.now();
    await studyGroup.save();
    
    res.status(200).json({ 
      message: 'Activity removed from study group', 
      studyGroup 
    });
  } catch (err) {
    console.error('Error removing activity from study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Join a study group (student only)
router.post('/:id/join', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only students can join study groups' });
    }
    
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }
    
    // Check if student is already in the group
    if (studyGroup.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }
    
    // Check if the group is public or if the student follows the teacher
    const student = await User.findById(req.user._id);
    
    if (!studyGroup.isPublic && !student.Following.includes(studyGroup.teacher)) {
      return res.status(403).json({ 
        message: 'This group is private. You need to follow the teacher first' 
      });
    }
    
    // Add student to group
    studyGroup.students.push(req.user._id);
    await studyGroup.save();
    
    res.status(200).json({ 
      message: 'Successfully joined study group', 
      studyGroup 
    });
  } catch (err) {
    console.error('Error joining study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Leave a study group (student only)
router.post('/:id/leave', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only students can leave study groups' });
    }
    
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }
    
    // Remove student from group
    studyGroup.students = studyGroup.students.filter(
      studentId => studentId.toString() !== req.user._id.toString()
    );
    
    await studyGroup.save();
    
    res.status(200).json({ 
      message: 'Successfully left study group'
    });
  } catch (err) {
    console.error('Error leaving study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete study group (teacher only)
router.delete('/:id', async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Verify ownership
    if (req.user.role !== 'teacher' || studyGroup.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this study group' });
    }
    
    await StudyGroup.deleteOne({ _id: req.params.id });
    
    res.status(200).json({ 
      message: 'Study group deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting study group:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;