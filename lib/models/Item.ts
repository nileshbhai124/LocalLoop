import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IItem extends Document {
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  pricePerDay: number;
  deposit?: number;
  images: Array<{
    url: string;
    publicId?: string;
  }>;
  owner: mongoose.Types.ObjectId;
  location: {
    type: string;
    coordinates: number[];
    address: string;
    city: string;
  };
  availability: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>({
  title: {
    type: String,
    required: [true, 'Please provide an item title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Tools', 'Electronics', 'Books', 'Sports', 'Kitchen', 'Home Decor', 'Accessories', 'Camping', 'Other']
  },
  condition: {
    type: String,
    required: [true, 'Please provide item condition'],
    enum: ['new', 'like-new', 'good', 'fair']
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Please provide price per day'],
    min: [0, 'Price cannot be negative']
  },
  deposit: {
    type: Number,
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    }
  },
  availability: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
itemSchema.index({ 'location.coordinates': '2dsphere' });
itemSchema.index({ category: 1, availability: 1 });
itemSchema.index({ owner: 1 });
itemSchema.index({ title: 'text', description: 'text' });

const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', itemSchema);

export default Item;
