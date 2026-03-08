import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  reviewer: mongoose.Types.ObjectId;
  reviewedUser: mongoose.Types.ObjectId;
  rental: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rental: {
    type: Schema.Types.ObjectId,
    ref: 'Rental',
    required: true
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ reviewedUser: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rental: 1 }, { unique: true });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review;
