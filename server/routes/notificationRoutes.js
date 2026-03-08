const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validation');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, mongoIdValidation, markAsRead);
router.delete('/:id', protect, mongoIdValidation, deleteNotification);

module.exports = router;
