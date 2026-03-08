const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversation,
  createConversation,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  getUnreadCount
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validation');

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.get('/unread/count', protect, getUnreadCount);
router.get('/:id', protect, mongoIdValidation, getConversation);
router.put('/:id/archive', protect, mongoIdValidation, archiveConversation);
router.put('/:id/unarchive', protect, mongoIdValidation, unarchiveConversation);
router.delete('/:id', protect, mongoIdValidation, deleteConversation);

module.exports = router;
