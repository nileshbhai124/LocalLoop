const express = require('express');
const router = express.Router();
const {
  reportDamage,
  updateRepairCost,
  disputeDamage,
  processSecurityDeposit,
  recordPickupCondition,
  recordReturnCondition,
  calculateDepositRefund,
  getDamageReport
} = require('../controllers/damageController');
const { protect } = require('../middleware/auth');
const { mongoIdValidation } = require('../middleware/validation');

// Damage reporting routes
router.post('/:id/report-damage', protect, mongoIdValidation, reportDamage);
router.put('/:id/damage/update-cost', protect, mongoIdValidation, updateRepairCost);
router.post('/:id/damage/dispute', protect, mongoIdValidation, disputeDamage);
router.get('/:id/damage', protect, mongoIdValidation, getDamageReport);

// Security deposit routes
router.post('/:id/process-deposit', protect, mongoIdValidation, processSecurityDeposit);
router.get('/:id/deposit/calculate', protect, mongoIdValidation, calculateDepositRefund);

// Condition tracking routes
router.post('/:id/condition/pickup', protect, mongoIdValidation, recordPickupCondition);
router.post('/:id/condition/return', protect, mongoIdValidation, recordReturnCondition);

module.exports = router;
