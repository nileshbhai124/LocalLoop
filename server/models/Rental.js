const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  
  // Security Deposit System
  securityDeposit: {
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'held', 'refunded', 'partially_refunded', 'forfeited'],
      default: 'pending'
    },
    refundedAmount: {
      type: Number,
      default: 0
    },
    deductedAmount: {
      type: Number,
      default: 0
    },
    refundedAt: Date,
    notes: String
  },
  
  // Damage Reporting
  damageReport: {
    reported: {
      type: Boolean,
      default: false
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: Date,
    description: {
      type: String,
      maxlength: [1000, 'Damage description cannot exceed 1000 characters']
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'total_loss'],
      default: 'minor'
    },
    images: [{
      url: String,
      publicId: String
    }],
    estimatedRepairCost: {
      type: Number,
      default: 0
    },
    actualRepairCost: {
      type: Number,
      default: 0
    },
    repairStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'not_required'],
      default: 'pending'
    },
    disputeStatus: {
      type: String,
      enum: ['none', 'disputed', 'resolved', 'escalated'],
      default: 'none'
    },
    disputeReason: String,
    resolution: String
  },
  
  // Item Condition Tracking
  conditionAtPickup: {
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    notes: String,
    images: [{
      url: String,
      publicId: String
    }],
    recordedAt: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  conditionAtReturn: {
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    notes: String,
    images: [{
      url: String,
      publicId: String
    }],
    recordedAt: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Payment Tracking
  payment: {
    rentalAmount: {
      type: Number,
      required: true
    },
    depositAmount: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentMethod: String,
    transactionId: String,
    paidAt: Date
  },
  
  // Late Return Tracking
  lateReturn: {
    isLate: {
      type: Boolean,
      default: false
    },
    daysLate: {
      type: Number,
      default: 0
    },
    lateFee: {
      type: Number,
      default: 0
    },
    lateFeeRate: {
      type: Number,
      default: 0 // Per day late fee
    }
  },
  
  // Actual Return Date
  actualReturnDate: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
rentalSchema.index({ borrower: 1, status: 1 });
rentalSchema.index({ owner: 1, status: 1 });
rentalSchema.index({ item: 1, status: 1 });
rentalSchema.index({ startDate: 1, endDate: 1 });
rentalSchema.index({ 'securityDeposit.status': 1 });
rentalSchema.index({ 'damageReport.reported': 1 });

// Validate end date is after start date
rentalSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Calculate late fees
rentalSchema.methods.calculateLateFees = function() {
  if (!this.actualReturnDate || !this.endDate) {
    return 0;
  }
  
  const returnDate = new Date(this.actualReturnDate);
  const dueDate = new Date(this.endDate);
  
  if (returnDate <= dueDate) {
    return 0;
  }
  
  const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
  const lateFeeRate = this.lateReturn.lateFeeRate || (this.totalPrice / 10); // 10% of rental per day
  
  this.lateReturn.isLate = true;
  this.lateReturn.daysLate = daysLate;
  this.lateReturn.lateFee = daysLate * lateFeeRate;
  
  return this.lateReturn.lateFee;
};

// Calculate security deposit refund
rentalSchema.methods.calculateDepositRefund = function() {
  const depositAmount = this.securityDeposit.amount;
  const repairCost = this.damageReport.actualRepairCost || this.damageReport.estimatedRepairCost || 0;
  const lateFee = this.lateReturn.lateFee || 0;
  
  const totalDeductions = repairCost + lateFee;
  const refundAmount = Math.max(0, depositAmount - totalDeductions);
  
  this.securityDeposit.deductedAmount = Math.min(totalDeductions, depositAmount);
  this.securityDeposit.refundedAmount = refundAmount;
  
  if (refundAmount === 0) {
    this.securityDeposit.status = 'forfeited';
  } else if (refundAmount < depositAmount) {
    this.securityDeposit.status = 'partially_refunded';
  } else {
    this.securityDeposit.status = 'refunded';
  }
  
  return {
    depositAmount,
    repairCost,
    lateFee,
    totalDeductions,
    refundAmount,
    remainingOwed: Math.max(0, totalDeductions - depositAmount)
  };
};

// Check if damage exceeds deposit
rentalSchema.methods.isDamageExceedingDeposit = function() {
  const repairCost = this.damageReport.actualRepairCost || this.damageReport.estimatedRepairCost || 0;
  return repairCost > this.securityDeposit.amount;
};

// Get remaining amount owed by renter
rentalSchema.methods.getRemainingAmountOwed = function() {
  const repairCost = this.damageReport.actualRepairCost || this.damageReport.estimatedRepairCost || 0;
  const lateFee = this.lateReturn.lateFee || 0;
  const totalCost = repairCost + lateFee;
  const depositAmount = this.securityDeposit.amount;
  
  return Math.max(0, totalCost - depositAmount);
};

module.exports = mongoose.model('Rental', rentalSchema);
