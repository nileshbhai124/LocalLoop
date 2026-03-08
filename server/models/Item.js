const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
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
    enum: [
      'Tools',
      'Electronics',
      'Books',
      'Sports Equipment',
      'Kitchen',
      'Garden',
      'Other'
    ]
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
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
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
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for search and filtering
itemSchema.index({ title: 'text', description: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ pricePerDay: 1 });
itemSchema.index({ 'location.coordinates': '2dsphere' });
itemSchema.index({ owner: 1 });
itemSchema.index({ availability: 1 });

// Virtual for rentals
itemSchema.virtual('rentals', {
  ref: 'Rental',
  localField: '_id',
  foreignField: 'item'
});

module.exports = mongoose.model('Item', itemSchema);
