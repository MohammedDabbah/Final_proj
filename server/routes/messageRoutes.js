const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// ✅ Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

router.use(requireAuth);

// ✅ Send a new message
router.post('/send', async (req, res) => {
  const { sender, receiver, content } = req.body;

  if (!sender || !receiver || !content) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const message = new Message({
      sender,
      receiver,
      content,
    });

    await message.save();

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Get all messages between current user and another user
router.get('/conversation/:userId', async (req, res) => {
  const currentUserId = req.user._id.toString();
  const targetUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        {
          'sender.id': currentUserId,
          'receiver.id': targetUserId,
        },
        {
          'sender.id': targetUserId,
          'receiver.id': currentUserId,
        },
      ],
    }).sort({ timestamp: 1 }); // oldest → newest

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Mark messages as seen (from specific sender)
router.patch('/seen/:userId', async (req, res) => {
    const currentUserId = req.user._id.toString();
    const senderId = req.params.userId;
  
    try {
      const result = await Message.updateMany(
        {
          'sender.id': senderId,
          'receiver.id': currentUserId,
          seen: false,
        },
        { $set: { seen: true } }
      );
  
      res.status(200).json({
        message: 'Messages marked as seen',
        modifiedCount: result.modifiedCount,
      });
    } catch (err) {
      console.error('Error marking messages as seen:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  
  // ✅ Get unread message count for logged-in user
router.get('/unread-count', async (req, res) => {
    const currentUserId = req.user._id.toString();
  
    try {
      const count = await Message.countDocuments({
        'receiver.id': currentUserId,
        seen: false,
      });
  
      res.status(200).json({ unreadCount: count });
    } catch (err) {
      console.error('Error fetching unread count:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ✅ Get list of recent chats for current user
// ✅ Get list of recent chats for current user
router.get('/chat-list', async (req, res) => {
  const userId = req.user._id.toString();

  try {
    // Get all messages involving the current user
    const allMessages = await Message.find({
      $or: [
        { 'sender.id': userId },
        { 'receiver.id': userId },
      ],
    }).sort({ timestamp: -1 });

    const uniqueChats = {};

    allMessages.forEach((msg) => {
      // Identify the other participant in the message
      const isSender = msg.sender.id === userId;
      const otherUser = isSender ? msg.receiver : msg.sender;

      // Fallback just in case role is not defined
      const otherUserId = otherUser.id;
      const otherUserRole = otherUser.role || 'user'; // default fallback

      // Only keep the first (latest) message per conversation
      if (!uniqueChats[otherUserId]) {
        uniqueChats[otherUserId] = {
          id: otherUserId,
          role: otherUserRole,
          lastMessage: msg.content,
          timestamp: msg.timestamp,
          seen: msg.seen,
          senderId: msg.sender.id,
        };
      }
    });

    res.status(200).json(Object.values(uniqueChats));
  } catch (err) {
    console.error('Error fetching chat list:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  
  

module.exports = router;
