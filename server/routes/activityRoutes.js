// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Teacher = require('../models/Teacher');

// Middleware to check if user is authenticated - DEVELOPMENT VERSION
const isAuthenticated = (req, res, next) => {
  // Development version - no authentication check
  next();
};

// Get all activities
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get all activities without teacher filter for development
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single activity by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(activity);
  } catch (err) {
    console.error('Error fetching activity:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new activity
router.post('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Creating activity with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ message: 'Activity name is required' });
    }
    
    if (!req.body.type || !['quiz', 'matching', 'fill-in'].includes(req.body.type)) {
      return res.status(400).json({ message: 'Valid activity type is required (quiz, matching, or fill-in)' });
    }

    // Validate quizType if type is quiz
    if (req.body.type === 'quiz' && req.body.quizType && !['reading', 'writing'].includes(req.body.quizType)) {
      return res.status(400).json({ message: 'Quiz type must be reading or writing' });
    }
    
    // Handle items - make sure they're properly formatted
    let items = [];
    if (Array.isArray(req.body.items)) {
      items = req.body.items.map(item => {
        // Create a clean item object with default values
        return {
          id: item.id || String(Date.now() + Math.random()),
          type: item.type || req.body.type, // Default to activity type
          text: item.text || '',
          word: item.word || item.text || '', // Default word to text if missing
          imageUrl: item.imageUrl || null,
          definition: item.definition || null
        };
      });
    }

    // Create a new activity with cleaned data
    let activityToCreate = {
      name: req.body.name,
      description: req.body.description || '',
      type: req.body.type,
      quizType: req.body.type === 'quiz' ? req.body.quizType : null,
      items: items,
      lastEdited: new Date()
    };
    
    // Find a teacher to assign
    try {
      // Find any teacher in the database
      const teacher = await Teacher.findOne();
      
      if (teacher) {
        activityToCreate.teacher = teacher._id;
        // console.log(Automatically assigned teacher: ${teacher._id});
      } else {
        return res.status(400).json({ 
          message: 'No teachers found in database. Please create a teacher first.' 
        });
      }
    } catch (teacherErr) {
      console.error('Error finding teacher:', teacherErr);
      return res.status(500).json({ message: 'Error finding teacher' });
    }
    
    // Create and save the activity with all fields properly set
    const newActivity = new Activity(activityToCreate);
    
    console.log('About to save activity:', JSON.stringify(newActivity, null, 2));
    
    try {
      const activity = await newActivity.save();
      console.log('Activity saved successfully with ID:', activity._id);
      res.status(201).json(activity);
    } catch (saveErr) {
      console.error('Error saving activity:', saveErr);
      
      if (saveErr.name === 'ValidationError') {
        const errorDetails = Object.keys(saveErr.errors).map(key => {
          return { field: key, message: saveErr.errors[key].message };
        });
        return res.status(400).json({ 
          message: 'Validation error', 
          details: errorDetails 
        });
      }
      
      throw saveErr;
    }
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message
    });
  }
});

// Update an activity
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('Updating activity with data:', JSON.stringify(req.body, null, 2));
    
    let activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // For development, allow updates to any activity
    // Clean up the data before updating
    const updateData = {
      name: req.body.name || activity.name,
      description: req.body.description || activity.description,
      type: req.body.type || activity.type,
      quizType: req.body.type === 'quiz' ? req.body.quizType : null,
      items: Array.isArray(req.body.items) ? req.body.items : activity.items,
      lastEdited: Date.now()
    };

    activity = await Activity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(activity);
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an activity
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // For development, allow deletion of any activity
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;