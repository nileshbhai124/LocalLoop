const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { createReviewValidation, mongoIdValidation } = require('../middleware/validation');

router.post('/', protect, createReviewValidation, createReview);
router.get('/:userId', mongoIdValidation, getUserReviews);

module.exports = router;
