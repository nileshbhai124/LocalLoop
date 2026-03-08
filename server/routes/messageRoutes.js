const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validation');

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, mongoIdValidation, getMessages);
router.post('/', protect, sendMessage);
router.put('/read/:userId', protect, mongoIdValidation, markAsRead);

module.exports = router;
