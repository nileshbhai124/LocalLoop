import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRental extends Document {
  item: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'rejected';
  message?: string;
  securityDeposit: {
    amount: number;
    status: 'pending' | 'held' | 'refunded' | 'partially_refunded' | 'forfeited';
    refundedAmount: number;
    deductedAmount: number;
    refundedAt?: Date;
    notes?: string;
  };
  damageReport?: {
    reported: boolean;
    reportedBy?: mongoose.Types.ObjectId;
    reportedAt?: Date;
    description?: string;
    severity?: 'minor' | 'moderate' | 'major' | 'total_loss';
    images?: Array<{ url: string; publicId?: string }>;
    estimatedRepairCost?: number;
    actualRepairCost?: number;
    repairStatus?: 'pending' | 'in_progress' | 'completed' | 'not_required';
    disputeStatus?: 'none' | 'disputed' | 'resolved' | 'escalated';
    disputeReason?: string;
    resolution?: string;
  };
  actualReturnDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rentalSchema = new Schema<IRental>({
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  borrower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
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
    maxlength: 500
  },
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
  damageReport: {
    reported: {
      type: Boolean,
      default: false
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: Date,
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'total_loss']
    },
    images: [{
      url: String,
      publicId: String
    }],
    estimatedRepairCost: Number,
    actualRepairCost: Number,
    repairStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'not_required']
    },
    disputeStatus: {
      type: String,
      enum: ['none', 'disputed', 'resolved', 'escalated']
    },
    disputeReason: String,
    resolution: String
  },
  actualReturnDate: Date
}, {
  timestamps: true
});

// Indexes
rentalSchema.index({ borrower: 1, status: 1 });
rentalSchema.index({ owner: 1, status: 1 });
rentalSchema.index({ item: 1, status: 1 });

const Rental: Model<IRental> = mongoose.models.Rental || mongoose.model<IRental>('Rental', rentalSchema);

export default Rental;
