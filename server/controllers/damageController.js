const Rental = require('../models/Rental');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Report damage on returned item
// @route   POST /api/rentals/:id/report-damage
// @access  Private (Owner only)
exports.reportDamage = async (req, res, next) => {
  try {
    const {
      description,
      severity,
      estimatedRepairCost,
      images
    } = req.body;

    const rental = await Rental.findById(req.params.id)
      .populate('item', 'title')
      .populate('borrower', 'name email')
      .populate('owner', 'name');

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Only owner can report damage
    if (rental.owner._id.toString() !== req.user.id) {
      return next(new AppError('Only the item owner can report damage', 403));
    }

    // Rental must be completed or active
    if (!['completed', 'active'].includes(rental.status)) {
      return next(new AppError('Can only report damage on active or completed rentals', 400));
    }

    // Update damage report
    rental.damageReport = {
      reported: true,
      reportedBy: req.user.id,
      reportedAt: new Date(),
      description,
      severity: severity || 'minor',
      images: images || [],
      estimatedRepairCost: estimatedRepairCost || 0,
      repairStatus: 'pending',
      disputeStatus: 'none'
    };

    await rental.save();

    // Create notification for borrower
    await Notification.create({
      user: rental.borrower._id,
      type: 'damage_reported',
      title: 'Damage Reported',
      message: `Damage has been reported on ${rental.item.title}. Estimated repair cost: $${estimatedRepairCost}`,
      relatedRental: rental._id
    });

    ApiResponse.success(res, rental, 'Damage reported successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update damage report with actual repair cost
// @route   PUT /api/rentals/:id/damage/update-cost
// @access  Private (Owner only)
exports.updateRepairCost = async (req, res, next) => {
  try {
    const { actualRepairCost, repairStatus } = req.body;

    const rental = await Rental.findById(req.params.id)
      .populate('borrower', 'name email');

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Only owner can update repair cost
    if (rental.owner.toString() !== req.user.id) {
      return next(new AppError('Only the item owner can update repair costs', 403));
    }

    if (!rental.damageReport.reported) {
      return next(new AppError('No damage report exists for this rental', 400));
    }

    rental.damageReport.actualRepairCost = actualRepairCost;
    rental.damageReport.repairStatus = repairStatus || 'completed';

    await rental.save();

    // Notify borrower of actual cost
    await Notification.create({
      user: rental.borrower._id,
      type: 'repair_cost_updated',
      title: 'Repair Cost Updated',
      message: `Actual repair cost: $${actualRepairCost}`,
      relatedRental: rental._id
    });

    ApiResponse.success(res, rental, 'Repair cost updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Dispute damage report
// @route   POST /api/rentals/:id/damage/dispute
// @access  Private (Borrower only)
exports.disputeDamage = async (req, res, next) => {
  try {
    const { disputeReason } = req.body;

    const rental = await Rental.findById(req.params.id)
      .populate('owner', 'name email');

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Only borrower can dispute
    if (rental.borrower.toString() !== req.user.id) {
      return next(new AppError('Only the borrower can dispute damage reports', 403));
    }

    if (!rental.damageReport.reported) {
      return next(new AppError('No damage report to dispute', 400));
    }

    rental.damageReport.disputeStatus = 'disputed';
    rental.damageReport.disputeReason = disputeReason;

    await rental.save();

    // Notify owner of dispute
    await Notification.create({
      user: rental.owner._id,
      type: 'damage_disputed',
      title: 'Damage Report Disputed',
      message: `${req.user.name} has disputed the damage report`,
      relatedRental: rental._id
    });

    ApiResponse.success(res, rental, 'Damage report disputed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Process security deposit refund
// @route   POST /api/rentals/:id/process-deposit
// @access  Private (Owner only)
exports.processSecurityDeposit = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('item', 'title')
      .populate('borrower', 'name email');

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Only owner can process deposit
    if (rental.owner.toString() !== req.user.id) {
      return next(new AppError('Only the item owner can process security deposits', 403));
    }

    // Rental must be completed
    if (rental.status !== 'completed') {
      return next(new AppError('Can only process deposit for completed rentals', 400));
    }

    // Calculate late fees if applicable
    if (rental.actualReturnDate) {
      rental.calculateLateFees();
    }

    // Calculate deposit refund
    const refundCalculation = rental.calculateDepositRefund();

    rental.securityDeposit.refundedAt = new Date();
    rental.securityDeposit.notes = `Deposit processed. Refund: $${refundCalculation.refundAmount}, Deductions: $${refundCalculation.totalDeductions}`;

    await rental.save();

    // Notify borrower
    let notificationMessage = `Security deposit processed for ${rental.item.title}. `;
    
    if (refundCalculation.refundAmount === rental.securityDeposit.amount) {
      notificationMessage += `Full deposit of $${refundCalculation.refundAmount} refunded.`;
    } else if (refundCalculation.refundAmount > 0) {
      notificationMessage += `Partial refund of $${refundCalculation.refundAmount}. Deductions: $${refundCalculation.totalDeductions}.`;
    } else {
      notificationMessage += `Deposit forfeited due to damages/fees totaling $${refundCalculation.totalDeductions}.`;
    }

    if (refundCalculation.remainingOwed > 0) {
      notificationMessage += ` You owe an additional $${refundCalculation.remainingOwed}.`;
    }

    await Notification.create({
      user: rental.borrower._id,
      type: 'deposit_processed',
      title: 'Security Deposit Processed',
      message: notificationMessage,
      relatedRental: rental._id
    });

    ApiResponse.success(res, {
      rental,
      refundCalculation
    }, 'Security deposit processed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Record item condition at pickup
// @route   POST /api/rentals/:id/condition/pickup
// @access  Private
exports.recordPickupCondition = async (req, res, next) => {
  try {
    const { condition, notes, images } = req.body;

    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Either owner or borrower can record pickup condition
    if (rental.owner.toString() !== req.user.id && rental.borrower.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    rental.conditionAtPickup = {
      condition,
      notes,
      images: images || [],
      recordedAt: new Date(),
      recordedBy: req.user.id
    };

    // Update rental status to active
    if (rental.status === 'approved') {
      rental.status = 'active';
    }

    await rental.save();

    ApiResponse.success(res, rental, 'Pickup condition recorded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Record item condition at return
// @route   POST /api/rentals/:id/condition/return
// @access  Private
exports.recordReturnCondition = async (req, res, next) => {
  try {
    const { condition, notes, images } = req.body;

    const rental = await Rental.findById(req.params.id)
      .populate('item', 'title')
      .populate('borrower', 'name')
      .populate('owner', 'name');

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Either owner or borrower can record return condition
    if (rental.owner._id.toString() !== req.user.id && rental.borrower._id.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    rental.conditionAtReturn = {
      condition,
      notes,
      images: images || [],
      recordedAt: new Date(),
      recordedBy: req.user.id
    };

    rental.actualReturnDate = new Date();

    // Calculate late fees
    rental.calculateLateFees();

    // Update rental status to completed
    rental.status = 'completed';

    await rental.save();

    // Notify the other party
    const notifyUser = req.user.id === rental.owner._id.toString() ? rental.borrower._id : rental.owner._id;
    
    await Notification.create({
      user: notifyUser,
      type: 'item_returned',
      title: 'Item Returned',
      message: `${rental.item.title} has been returned and condition recorded`,
      relatedRental: rental._id
    });

    ApiResponse.success(res, rental, 'Return condition recorded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get deposit refund calculation
// @route   GET /api/rentals/:id/deposit/calculate
// @access  Private
exports.calculateDepositRefund = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Only owner or borrower can view
    if (rental.owner.toString() !== req.user.id && rental.borrower.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    // Calculate late fees if applicable
    if (rental.actualReturnDate) {
      rental.calculateLateFees();
    }

    const refundCalculation = rental.calculateDepositRefund();

    ApiResponse.success(res, refundCalculation, 'Deposit refund calculated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get rental damage report
// @route   GET /api/rentals/:id/damage
// @access  Private
exports.getDamageReport = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('damageReport.reportedBy', 'name')
      .populate('item', 'title')
      .populate('borrower', 'name')
      .populate('owner', 'name');

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Only owner or borrower can view
    if (rental.owner._id.toString() !== req.user.id && rental.borrower._id.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    if (!rental.damageReport.reported) {
      return next(new AppError('No damage report exists for this rental', 404));
    }

    ApiResponse.success(res, rental.damageReport, 'Damage report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportDamage: exports.reportDamage,
  updateRepairCost: exports.updateRepairCost,
  disputeDamage: exports.disputeDamage,
  processSecurityDeposit: exports.processSecurityDeposit,
  recordPickupCondition: exports.recordPickupCondition,
  recordReturnCondition: exports.recordReturnCondition,
  calculateDepositRefund: exports.calculateDepositRefund,
  getDamageReport: exports.getDamageReport
};
