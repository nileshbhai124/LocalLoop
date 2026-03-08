import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'borrow-request' | 'approval' | 'rejection' | 'message' | 'review' | 'reminder';
  title: string;
  message: string;
  relatedItem?: mongoose.Types.ObjectId;
  relatedRental?: mongoose.Types.ObjectId;
  relatedUser?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['borrow-request', 'approval', 'rejection', 'message', 'review', 'reminder'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedItem: {
    type: Schema.Types.ObjectId,
    ref: 'Item'
  },
  relatedRental: {
    type: Schema.Types.ObjectId,
    ref: 'Rental'
  },
  relatedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
