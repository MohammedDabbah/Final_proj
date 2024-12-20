const express = require('express');
const authRoutes = require('./auth');

const router = express.Router();

// Root Route
router.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Mount Auth Routes
router.use('/auth', authRoutes);

module.exports = router;
