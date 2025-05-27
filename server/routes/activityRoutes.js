const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const Answers = require('../models/Answers');

// Create a new activity
router.post('/', async (req, res) => {
  const { title, description, type, skill, tasks, dueDate, targetLevel } = req.body;
  const createdBy = req.user._id;

  try {
    const activity = await Activity.create({
      title,
      description,
      type,
      skill,
      tasks,
      targetLevel,
      dueDate,
      createdBy
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity', details: err.message });
  }
});

// Get activities by teacher
router.get('/teacher', async (req, res) => {
  const teacherId = req.user._id;

  try {
    const activities = await Activity.find({ createdBy: teacherId });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching activities' });
  }
});

// Get activities assigned to a student
router.get('/student', async (req, res) => {
  const studentId = req.user._id;

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Fetch all activities for this student level
    const activities = await Activity.find({
      targetLevel: student.userLevel,
    });

    const answers = await Answers.find({ studentId });

    // Map answers by activityId for quick lookup
    const answersByActivity = {};
    answers.forEach(ans => {
      answersByActivity[ans.activityId.toString()] = ans;
    });

    // Enrich activities with submission info
    const enriched = activities.map(act => {
      const answer = answersByActivity[act._id.toString()];
      const enrichedActivity = {
        ...act.toObject(),
        alreadySubmitted: !!answer,
      };

      if (answer) {
        enrichedActivity.responses = {};
        enrichedActivity.feedback = {};

        answer.responses.forEach(({ taskIndex, response, feedback }) => {
          enrichedActivity.responses[taskIndex] = response;
          enrichedActivity.feedback[taskIndex] = feedback || null;
        });
      }

      return enrichedActivity;
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching assigned activities:', err);
    res.status(500).json({ error: 'Error fetching assigned activities' });
  }
});



router.post('/answers', async (req, res) => {
  try {
    const { activityId, responses } = req.body;
    const studentId = req.user._id;

    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // בדיקה שהתלמיד מוקצה לפעילות (אם משתמשים בזה)
    // if (!activity.assignedTo.includes(studentId)) {
    //   return res.status(403).json({ message: 'You are not assigned to this activity' });
    // }

    const teacherId = activity.createdBy;

    const responseArray = Object.entries(responses).map(([index, response]) => ({
      taskIndex: parseInt(index),
      response,
    }));

    const answerDoc = await Answers.findOneAndUpdate(
      { activityId, studentId },
      { activityId, studentId, teacherId, responses: responseArray },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Answers submitted successfully', answerId: answerDoc._id });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// PATCH /api/answers/:answerId/feedback
router.patch('/:answerId/feedback', async (req, res) => {
  const { feedbacks } = req.body;

  try {
    const answer = await Answers.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    // Update feedbacks by taskIndex
    answer.responses = answer.responses.map(resp => ({
      ...resp,
      feedback: feedbacks[resp.taskIndex] || resp.feedback,
    }));

    await answer.save();
    res.json({ message: 'Feedback saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving feedback' });
  }
});

router.get('/:activityId/answers', async (req, res) => {
  const teacherId = req.user._id;
  const { activityId } = req.params;

  try {
    const answers = await Answers.find({ activityId, teacherId })
      .populate('studentId', 'FName LName email') // Adjust fields as needed
      .sort({ submittedAt: -1 });

    res.json(answers);
  } catch (err) {
    console.error('Error fetching answers:', err);
    res.status(500).json({ message: 'Could not fetch answers' });
  }
});





module.exports = router;
