const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserById
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validation');

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.get('/:id', mongoIdValidation, getUserById);

module.exports = router;
