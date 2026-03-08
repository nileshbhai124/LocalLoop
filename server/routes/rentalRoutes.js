const express = require('express');
const router = express.Router();
const {
  createRentalRequest,
  approveRental,
  rejectRental,
  getUserRentals,
  completeRental
} = require('../controllers/rentalController');
const { protect } = require('../middleware/auth');
const { createRentalValidation, mongoIdValidation } = require('../middleware/validation');

router.post('/request', protect, createRentalValidation, createRentalRequest);
router.get('/user', protect, getUserRentals);
router.put('/:id/approve', protect, mongoIdValidation, approveRental);
router.put('/:id/reject', protect, mongoIdValidation, rejectRental);
router.put('/:id/complete', protect, mongoIdValidation, completeRental);

module.exports = router;
