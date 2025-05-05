// ActivitySubmissionroutes.js
const express = require('express');
const router = express.Router();
const ActivitySubmission = require('../models/ActivitySubmission');
const Activity = require('../models/Activity');
const StudyGroup = require('../models/StudyGroup');
const axios = require('axios');
const { AI_API_KEY } = require('../config/config');
// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

router.use(requireAuth);

// Initialize or get a draft submission
router.post('/init', async (req, res) => {
  try {
    const { activityId, studyGroupId } = req.body;
    
    if (!activityId || !studyGroupId) {
      return res.status(400).json({ message: 'Activity ID and study group ID are required' });
    }

    // Verify user is a student
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only students can create submissions' });
    }

    // Verify the activity and study group exist
    const activity = await Activity.findById(activityId);
    const studyGroup = await StudyGroup.findById(studyGroupId);
    
    if (!activity || !studyGroup) {
      return res.status(404).json({ message: 'Activity or study group not found' });
    }

    // Verify student is enrolled in the study group
    if (!studyGroup.students.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be enrolled in the study group' });
    }

    // Check if a draft already exists
    let submission = await ActivitySubmission.findOne({
      student: req.user._id,
      activity: activityId,
      studyGroup: studyGroupId,
      status: 'draft'
    });

    if (!submission) {
      // Create a new draft submission
      submission = new ActivitySubmission({
        student: req.user._id,
        activity: activityId,
        studyGroup: studyGroupId,
        answers: []
      });
      
      await submission.save();
    }
    
    res.status(200).json(submission);
  } catch (err) {
    console.error('Error initializing submission:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a draft submission answer
router.put('/answer', async (req, res) => {
  try {
    const { submissionId, itemId, answer } = req.body;
    
    if (!submissionId || !itemId) {
      return res.status(400).json({ message: 'Submission ID and item ID are required' });
    }

    // Find the submission
    const submission = await ActivitySubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify ownership
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this submission' });
    }

    // Verify submission is still a draft
    if (submission.status !== 'draft') {
      return res.status(400).json({ message: 'Cannot update a submitted assignment' });
    }

    // Update or add the answer
    const answerIndex = submission.answers.findIndex(a => a.itemId === itemId);
    
    if (answerIndex >= 0) {
      submission.answers[answerIndex].studentAnswer = answer;
    } else {
      submission.answers.push({
        itemId,
        studentAnswer: answer
      });
    }
    
    submission.lastEdited = Date.now();
    await submission.save();
    
    res.status(200).json(submission);
  } catch (err) {
    console.error('Error updating submission answer:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit a completed assignment
router.post('/submit', async (req, res) => {
  try {
    const { submissionId } = req.body;
    
    if (!submissionId) {
      return res.status(400).json({ message: 'Submission ID is required' });
    }

    // Find the submission
    const submission = await ActivitySubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify ownership
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this assignment' });
    }

    // Verify submission is still a draft
    if (submission.status !== 'draft') {
      return res.status(400).json({ message: 'Assignment has already been submitted' });
    }

    // Update submission status
    submission.status = 'submitted';
    submission.submittedAt = Date.now();
    
    await submission.save();
    
    // Generate AI feedback
    generateAIFeedback(submission._id);
    
    res.status(200).json({ 
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (err) {
    console.error('Error submitting assignment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get submission by ID
router.get('/:id', async (req, res) => {
  try {
    const submission = await ActivitySubmission.findById(req.params.id)
      .populate('student', 'FName LName Email')
      .populate('activity')
      .populate('studyGroup', 'name teacher');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check permissions
    const isStudent = req.user.role === 'user' && 
                     submission.student._id.toString() === req.user._id.toString();
    
    const isTeacher = req.user.role === 'teacher';
    
    if (isTeacher) {
      // Verify teacher owns the study group
      const studyGroup = await StudyGroup.findById(submission.studyGroup);
      if (studyGroup.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this submission' });
      }
    }
    
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to view this submission' });
    }
    
    res.status(200).json(submission);
  } catch (err) {
    console.error('Error fetching submission:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all submissions for a study group (teacher only)
router.get('/group/:groupId', async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can view all submissions' });
    }

    // Verify teacher owns the study group
    const studyGroup = await StudyGroup.findById(req.params.groupId);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }
    
    if (studyGroup.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these submissions' });
    }

    // Get all submissions for this study group
    const submissions = await ActivitySubmission.find({ studyGroup: req.params.groupId })
      .populate('student', 'FName LName Email')
      .populate('activity', 'name type')
      .sort({ submittedAt: -1 });
    
    res.status(200).json(submissions);
  } catch (err) {
    console.error('Error fetching group submissions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all submissions for a student in a study group
router.get('/student/:groupId', async (req, res) => {
  try {
    // Verify user is a student
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only students can view their own submissions' });
    }

    // Verify the study group exists
    const studyGroup = await StudyGroup.findById(req.params.groupId);
    
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Verify student is enrolled in the study group
    if (!studyGroup.students.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be enrolled in the study group' });
    }

    // Get all submissions for this student in this study group
    const submissions = await ActivitySubmission.find({ 
      student: req.user._id,
      studyGroup: req.params.groupId 
    })
    .populate('activity', 'name type')
    .sort({ submittedAt: -1 });
    
    res.status(200).json(submissions);
  } catch (err) {
    console.error('Error fetching student submissions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add teacher feedback and/or approve AI feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const { feedback, approveAiFeedback } = req.body;
    
    // Verify user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can provide feedback' });
    }

    // Find the submission
    const submission = await ActivitySubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher owns the study group
    const studyGroup = await StudyGroup.findById(submission.studyGroup);
    
    if (!studyGroup || studyGroup.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this submission' });
    }

    // If approving AI feedback
    if (approveAiFeedback) {
      submission.feedback.forEach(item => {
        if (item.source === 'ai') {
          item.approved = true;
        }
      });
    }

    // If adding new teacher feedback
    if (feedback) {
      submission.feedback.push({
        content: feedback,
        source: 'teacher',
        approved: true
      });
    }

    // Update submission status
    submission.status = 'reviewed';
    submission.reviewedAt = Date.now();
    
    await submission.save();
    
    res.status(200).json({ 
      message: 'Feedback provided successfully',
      submission
    });
  } catch (err) {
    console.error('Error providing feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mark submission as completed
router.post('/:id/complete', async (req, res) => {
  try {
    // Find the submission
    const submission = await ActivitySubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher') {
      // Verify teacher owns the study group
      const studyGroup = await StudyGroup.findById(submission.studyGroup);
      if (!studyGroup || studyGroup.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to complete this submission' });
      }
    } else if (req.user.role === 'user') {
      // Verify student owns the submission and it has been reviewed
      if (submission.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to complete this submission' });
      }
      if (submission.status !== 'reviewed') {
        return res.status(400).json({ message: 'Submission must be reviewed before completion' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update submission status
    submission.status = 'completed';
    await submission.save();
    
    res.status(200).json({ 
      message: 'Submission marked as completed',
      submission
    });
  } catch (err) {
    console.error('Error completing submission:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Helper function to generate AI feedback
async function generateAIFeedback(submissionId) {
  try {
    const submission = await ActivitySubmission.findById(submissionId)
      .populate('activity');
    
    if (!submission || submission.status !== 'submitted') {
      console.error('Invalid submission for AI feedback');
      return;
    }
    
    // Get activity details
    const activity = submission.activity;
    if (!activity) {
      console.error('Activity not found for submission');
      return;
    }
    
    // Prepare data for AI analysis
    let activityItems = [];
    if (activity.items && Array.isArray(activity.items)) {
      // Parse stringified items if needed
      activityItems = activity.items.map(item => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch (e) {
            return { text: item };
          }
        }
        return item;
      });
    }
    
    // Match student answers with activity items
    const answersWithItems = submission.answers.map(answer => {
      const matchingItem = activityItems.find(item => 
        item.id === answer.itemId || item.id?.toString() === answer.itemId
      );
      
      return {
        question: matchingItem?.text || matchingItem?.word || 'Unknown question',
        answer: answer.studentAnswer,
        itemType: matchingItem?.type || activity.type
      };
    });
    
    // Call OpenAI API for analysis
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an educational assistant providing feedback on student submissions.
          Your task is to analyze each answer and provide constructive feedback.
          For each answer, determine if it's correct, partially correct, or incorrect.
          Provide specific guidance on how to improve.
          Be encouraging and supportive while still identifying areas for growth.
          Format your feedback clearly with one section per answer.`
        },
        {
          role: 'user',
          content: `Activity type: ${activity.type}${activity.quizType ? ` (${activity.quizType})` : ''}
          Student answers to evaluate:
          ${JSON.stringify(answersWithItems, null, 2)}
          
          Provide thorough educational feedback for each answer.`
        }
      ],
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add AI feedback to the submission
    if (response.data?.choices?.[0]?.message?.content) {
      const aiContent = response.data.choices[0].message.content;
      
      submission.feedback.push({
        content: aiContent,
        source: 'ai',
        approved: false
      });
      
      // Save the updated submission
      await submission.save();
      console.log('AI feedback generated successfully for submission:', submissionId);
    }
  } catch (error) {
    console.error('Error generating AI feedback:', error);
  }
}
module.exports = router; 