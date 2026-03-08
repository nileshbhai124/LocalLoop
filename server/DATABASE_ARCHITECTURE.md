# LocalLoop Database Architecture

## Overview

This document outlines the complete database architecture for LocalLoop, a neighborhood sharing platform built on MongoDB with Mongoose ODM.

## Technology Stack

- **Database**: MongoDB 5.0+
- **ODM**: Mongoose 8.0+
- **Indexing**: Compound indexes, geospatial indexes, text indexes
- **Scalability**: Sharding-ready design, optimized for horizontal scaling

## Design Principles

1. **Normalized but Practical** - Balance between normalization and query performance
2. **Indexed for Performance** - Strategic indexes on frequently queried fields
3. **Scalable Relationships** - References over embedding for large collections
4. **Security First** - Encrypted sensitive data, validation at schema level
5. **Query Optimized** - Designed for common access patterns

---

## Collections Overview

```
┌─────────────┐
│    Users    │──┐
└─────────────┘  │
                 │ owns
                 ▼
┌─────────────┐  ┌─────────────┐
│   Items     │──│   Rentals   │
└─────────────┘  └─────────────┘
       │                │
       │ references     │ references
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  Messages   │  │   Reviews   │
└─────────────┘  └─────────────┘
       │
       │ triggers
       ▼
┌─────────────┐
│Notifications│
└─────────────┘
```

---

## Collection Schemas

### 1. Users Collection

**Purpose**: Store user accounts, profiles, and authentication data

**Schema Design**:

```javascript
const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Never return password in queries
  },
  
  // Profile Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  // Location (GeoJSON format for geospatial queries)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    state: String,
    zipCode: String
  },
  
  // Statistics
  ratingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: v => Math.round(v * 10) / 10 // Round to 1 decimal
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  itemsListed: {
    type: Number,
    default: 0,
    min: 0
  },
  itemsBorrowed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Timestamps
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ 'location.city': 1 });
userSchema.index({ ratingAverage: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for items owned
userSchema.virtual('items', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'owner'
});
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe",
  "avatar": "https://cloudinary.com/avatar.jpg",
  "bio": "Love sharing tools with neighbors",
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102"
  },
  "ratingAverage": 4.8,
  "totalReviews": 24,
  "itemsListed": 5,
  "itemsBorrowed": 12,
  "totalEarnings": 450.00,
  "isActive": true,
  "isVerified": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-03-10T15:30:00.000Z"
}
```

---

### 2. Items Collection

**Purpose**: Store items available for lending/renting

**Schema Design**:

```javascript
const itemSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: 'text'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    index: 'text'
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Tools', 'Electronics', 'Books', 'Sports Equipment', 
               'Kitchen', 'Garden', 'Furniture', 'Other'],
      message: '{VALUE} is not a valid category'
    },
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Condition & Pricing
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: {
      values: ['new', 'like-new', 'good', 'fair'],
      message: '{VALUE} is not a valid condition'
    }
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: [0, 'Price cannot be negative'],
    index: true
  },
  pricePerWeek: {
    type: Number,
    min: 0
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Location (GeoJSON)
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
      required: true,
      index: true
    },
    state: String,
    zipCode: String
  },
  
  // Availability
  availabilityStatus: {
    type: String,
    enum: ['available', 'rented', 'unavailable'],
    default: 'available',
    index: true
  },
  unavailableDates: [{
    startDate: Date,
    endDate: Date
  }],
  
  // Statistics
  ratingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  timesRented: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Indexes for common queries
itemSchema.index({ title: 'text', description: 'text' });
itemSchema.index({ 'location.coordinates': '2dsphere' });
itemSchema.index({ category: 1, pricePerDay: 1 });
itemSchema.index({ owner: 1, availabilityStatus: 1 });
itemSchema.index({ availabilityStatus: 1, category: 1, pricePerDay: 1 });
itemSchema.index({ ratingAverage: -1, views: -1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ isFeatured: 1, ratingAverage: -1 });

// Virtual for rentals
itemSchema.virtual('rentals', {
  ref: 'Rental',
  localField: '_id',
  foreignField: 'itemId'
});
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "DeWalt Cordless Drill Set",
  "description": "Professional 20V drill with battery and charger",
  "category": "Tools",
  "subcategory": "Power Tools",
  "tags": ["drill", "power-tool", "dewalt"],
  "condition": "like-new",
  "pricePerDay": 15,
  "pricePerWeek": 80,
  "deposit": 50,
  "images": [
    {
      "url": "https://cloudinary.com/drill1.jpg",
      "publicId": "localloop/drill_abc123",
      "isPrimary": true
    }
  ],
  "owner": "507f1f77bcf86cd799439011",
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA"
  },
  "availabilityStatus": "available",
  "ratingAverage": 4.9,
  "totalReviews": 8,
  "views": 156,
  "timesRented": 12,
  "totalRevenue": 240,
  "isActive": true,
  "isFeatured": false,
  "createdAt": "2024-02-01T10:00:00.000Z"
}
```

---

### 3. Rentals Collection

**Purpose**: Track all rental transactions and their lifecycle

**Schema Design**:

```javascript
const rentalSchema = new mongoose.Schema({
  // References
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Rental Period
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    index: true
  },
  actualReturnDate: Date,
  
  // Status Tracking
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  
  // Payment Information
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partial'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'paypal', 'venmo', 'other']
  },
  transactionId: String,
  
  // Communication
  requestMessage: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  ownerNotes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Pickup/Return Details
  pickupMethod: {
    type: String,
    enum: ['pickup', 'delivery', 'meetup']
  },
  pickupLocation: String,
  pickupTime: Date,
  returnMethod: {
    type: String,
    enum: ['return', 'delivery', 'meetup']
  },
  returnLocation: String,
  returnTime: Date,
  
  // Condition Tracking
  itemConditionAtPickup: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  itemConditionAtReturn: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  damageReported: {
    type: Boolean,
    default: false
  },
  damageDescription: String,
  damagePhotos: [String],
  
  // Reviews
  borrowerReviewed: {
    type: Boolean,
    default: false
  },
  ownerReviewed: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Compound Indexes
rentalSchema.index({ borrowerId: 1, status: 1, startDate: -1 });
rentalSchema.index({ ownerId: 1, status: 1, startDate: -1 });
rentalSchema.index({ itemId: 1, status: 1 });
rentalSchema.index({ status: 1, startDate: 1, endDate: 1 });
rentalSchema.index({ paymentStatus: 1, status: 1 });
rentalSchema.index({ createdAt: -1 });

// Validation: End date must be after start date
rentalSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "itemId": "507f1f77bcf86cd799439012",
  "ownerId": "507f1f77bcf86cd799439011",
  "borrowerId": "507f1f77bcf86cd799439014",
  "startDate": "2024-03-15T09:00:00.000Z",
  "endDate": "2024-03-20T18:00:00.000Z",
  "status": "active",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2024-03-10T10:00:00.000Z"
    },
    {
      "status": "approved",
      "timestamp": "2024-03-10T14:30:00.000Z"
    },
    {
      "status": "active",
      "timestamp": "2024-03-15T09:15:00.000Z"
    }
  ],
  "pricePerDay": 15,
  "totalDays": 5,
  "totalPrice": 75,
  "deposit": 50,
  "paymentStatus": "paid",
  "paymentMethod": "card",
  "requestMessage": "Need this for a home renovation project",
  "pickupMethod": "pickup",
  "pickupTime": "2024-03-15T09:00:00.000Z",
  "itemConditionAtPickup": "excellent",
  "borrowerReviewed": false,
  "ownerReviewed": false,
  "createdAt": "2024-03-10T10:00:00.000Z"
}
```

---

### 4. Messages Collection

**Purpose**: Store chat messages between users

**Schema Design**:

```javascript
const messageSchema = new mongoose.Schema({
  // Participants
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Context
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null,
    index: true
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    default: null
  },
  
  // Content
  messageText: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: String,
    type: String,
    filename: String,
    size: Number
  }],
  
  // Status
  readStatus: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  deliveredAt: Date,
  
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound Indexes for conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, readStatus: 1, timestamp: -1 });
messageSchema.index({ itemId: 1, timestamp: -1 });
messageSchema.index({ 
  senderId: 1, 
  receiverId: 1, 
  timestamp: -1 
}, { 
  name: 'conversation_index' 
});

// TTL Index - Auto-delete messages older than 1 year
messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "senderId": "507f1f77bcf86cd799439014",
  "receiverId": "507f1f77bcf86cd799439011",
  "itemId": "507f1f77bcf86cd799439012",
  "messageText": "Hi! Is the drill still available for March 15-20?",
  "messageType": "text",
  "readStatus": true,
  "readAt": "2024-03-10T10:15:00.000Z",
  "timestamp": "2024-03-10T10:00:00.000Z"
}
```

---

### 5. Reviews Collection

**Purpose**: Store reviews and ratings between users

**Schema Design**:
```javascript
const reviewSchema = new mongoose.Schema({
  // Participants
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Context
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true,
    unique: true // One review per rental per reviewer
  },
  
  // Review Type
  reviewType: {
    type: String,
    enum: ['borrower-to-owner', 'owner-to-borrower', 'item'],
    required: true
  },
  
  // Rating & Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    index: true
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  
  // Detailed Ratings (optional)
  detailedRatings: {
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    condition: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Response
  response: {
    text: String,
    respondedAt: Date
  },
  
  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  isHidden: {
    type: Boolean,
    default: false
  },
  
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ reviewedUserId: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ itemId: 1, rating: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ rentalId: 1, reviewerId: 1 }, { unique: true });

// Prevent duplicate reviews
reviewSchema.index({ reviewerId: 1, rentalId: 1 }, { unique: true });
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "reviewerId": "507f1f77bcf86cd799439014",
  "reviewedUserId": "507f1f77bcf86cd799439011",
  "itemId": "507f1f77bcf86cd799439012",
  "rentalId": "507f1f77bcf86cd799439013",
  "reviewType": "borrower-to-owner",
  "rating": 5,
  "comment": "Great experience! Drill was in perfect condition.",
  "detailedRatings": {
    "communication": 5,
    "condition": 5,
    "punctuality": 5,
    "overall": 5
  },
  "helpfulCount": 3,
  "createdAt": "2024-03-21T10:00:00.000Z"
}
```

---

### 6. Notifications Collection

**Purpose**: Store system notifications for users

**Schema Design**:

```javascript
const notificationSchema = new mongoose.Schema({
  // Recipient
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification Details
  type: {
    type: String,
    enum: [
      'borrow_request',
      'rental_approved',
      'rental_rejected',
      'rental_active',
      'rental_completed',
      'new_message',
      'review_received',
      'payment_received',
      'reminder',
      'system'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Related Entities
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  relatedRental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    default: null
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Action Link
  actionUrl: String,
  actionText: String,
  
  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery
  deliveryMethod: {
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
    default: 'in-app'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// TTL Index - Auto-delete read notifications older than 90 days
notificationSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 7776000, // 90 days
    partialFilterExpression: { isRead: true }
  }
);
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "userId": "507f1f77bcf86cd799439011",
  "type": "borrow_request",
  "title": "New Borrow Request",
  "message": "John Doe wants to borrow your DeWalt Drill",
  "relatedItem": "507f1f77bcf86cd799439012",
  "relatedRental": "507f1f77bcf86cd799439013",
  "relatedUser": "507f1f77bcf86cd799439014",
  "actionUrl": "/rentals/507f1f77bcf86cd799439013",
  "actionText": "View Request",
  "isRead": false,
  "priority": "high",
  "deliveryMethod": "in-app",
  "createdAt": "2024-03-10T10:00:00.000Z"
}
```

---

## Advanced Collections (Optional)

### 7. Favorites/Wishlist Collection

```javascript
const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index
favoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true });
```

### 8. Item Views/Analytics Collection

```javascript
const itemViewSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for analytics
itemViewSchema.index({ itemId: 1, viewedAt: -1 });
itemViewSchema.index({ userId: 1, viewedAt: -1 });

// TTL - Auto-delete after 180 days
itemViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 15552000 });
```

### 9. Fraud Detection Logs

```javascript
const fraudLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['suspicious_activity', 'multiple_accounts', 'payment_fraud', 'fake_listing', 'spam'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

fraudLogSchema.index({ userId: 1, resolved: 1, createdAt: -1 });
fraudLogSchema.index({ type: 1, severity: 1 });
```

---

## Indexing Strategy

### Primary Indexes

1. **Unique Indexes**
   - `users.email` - Ensure unique emails
   - `rentals.rentalId + reviewerId` - Prevent duplicate reviews

2. **Geospatial Indexes**
   - `users.location.coordinates` (2dsphere)
   - `items.location.coordinates` (2dsphere)

3. **Text Indexes**
   - `items.title` and `items.description` - Full-text search

4. **Compound Indexes**
   - `items: { category: 1, pricePerDay: 1 }` - Category + price filtering
   - `rentals: { borrowerId: 1, status: 1, startDate: -1 }` - User rental history
   - `messages: { senderId: 1, receiverId: 1, timestamp: -1 }` - Conversations

### Performance Optimization

```javascript
// Example: Efficient nearby items query
db.items.find({
  'location.coordinates': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      $maxDistance: 10000 // 10km in meters
    }
  },
  category: 'Tools',
  availabilityStatus: 'available',
  pricePerDay: { $lte: 50 }
}).limit(20);
```

---

## Common Query Patterns

### 1. Find Nearby Available Items

```javascript
// Query with geospatial, category, and price filters
const nearbyItems = await Item.find({
  'location.coordinates': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: distance * 1000 // Convert km to meters
    }
  },
  category: 'Tools',
  availabilityStatus: 'available',
  pricePerDay: { $gte: minPrice, $lte: maxPrice }
})
.populate('owner', 'name avatar ratingAverage')
.limit(20)
.lean();
```

### 2. Get User's Rental History

```javascript
// Efficient query with compound index
const rentals = await Rental.find({
  borrowerId: userId,
  status: { $in: ['completed', 'active'] }
})
.populate('itemId', 'title images pricePerDay')
.populate('ownerId', 'name avatar')
.sort({ startDate: -1 })
.limit(10)
.lean();
```

### 3. Get Conversation Messages

```javascript
// Uses compound index: senderId + receiverId + timestamp
const messages = await Message.find({
  $or: [
    { senderId: user1Id, receiverId: user2Id },
    { senderId: user2Id, receiverId: user1Id }
  ]
})
.sort({ timestamp: -1 })
.limit(50)
.lean();
```

### 4. Calculate User Rating

```javascript
// Aggregate reviews to update user rating
const result = await Review.aggregate([
  { $match: { reviewedUserId: userId } },
  {
    $group: {
      _id: '$reviewedUserId',
      avgRating: { $avg: '$rating' },
      totalReviews: { $sum: 1 }
    }
  }
]);

await User.findByIdAndUpdate(userId, {
  ratingAverage: result[0].avgRating,
  totalReviews: result[0].totalReviews
});
```

### 5. Search Items with Text Search

```javascript
// Full-text search with filters
const items = await Item.find({
  $text: { $search: searchQuery },
  category: 'Electronics',
  availabilityStatus: 'available'
})
.select({ score: { $meta: 'textScore' } })
.sort({ score: { $meta: 'textScore' } })
.limit(20);
```

---

## Scalability Recommendations

### 1. Sharding Strategy

**Shard Key Selection**:
- **Users**: Shard by `_id` (hash-based) for even distribution
- **Items**: Shard by `location.city` + `_id` for location-based queries
- **Rentals**: Shard by `borrowerId` for user-centric queries
- **Messages**: Shard by `senderId` for conversation distribution

```javascript
// Enable sharding
sh.enableSharding("localloop");

// Shard users collection
sh.shardCollection("localloop.users", { "_id": "hashed" });

// Shard items with compound key
sh.shardCollection("localloop.items", { "location.city": 1, "_id": 1 });

// Shard rentals
sh.shardCollection("localloop.rentals", { "borrowerId": 1, "_id": 1 });
```

### 2. Read Replicas

```javascript
// Configure read preference for analytics queries
const items = await Item.find(query)
  .read('secondaryPreferred')
  .lean();
```

### 3. Caching Strategy

**Redis Caching**:
- User profiles (TTL: 1 hour)
- Popular items (TTL: 30 minutes)
- Search results (TTL: 15 minutes)
- Conversation lists (TTL: 5 minutes)

```javascript
// Example: Cache user profile
const cacheKey = `user:${userId}`;
let user = await redis.get(cacheKey);

if (!user) {
  user = await User.findById(userId).lean();
  await redis.setex(cacheKey, 3600, JSON.stringify(user));
}
```

### 4. Pagination Best Practices

```javascript
// Cursor-based pagination for large datasets
const items = await Item.find({
  _id: { $gt: lastSeenId },
  availabilityStatus: 'available'
})
.sort({ _id: 1 })
.limit(20)
.lean();
```

### 5. Aggregation Pipeline Optimization

```javascript
// Efficient aggregation with indexes
const stats = await Rental.aggregate([
  { $match: { ownerId: userId, status: 'completed' } },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: '$totalPrice' },
      totalRentals: { $sum: 1 },
      avgRating: { $avg: '$rating' }
    }
  }
]);
```

---

## Data Retention Policies

### TTL Indexes for Auto-Cleanup

1. **Messages**: Delete after 1 year
2. **Notifications**: Delete read notifications after 90 days
3. **Item Views**: Delete after 180 days
4. **Temporary Data**: Delete after 24 hours

```javascript
// Example TTL index
messageSchema.index(
  { timestamp: 1 }, 
  { expireAfterSeconds: 31536000 }
);
```

---

## Security Best Practices

### 1. Password Hashing

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### 2. Sensitive Data Protection

```javascript
// Never return password in queries
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  return obj;
};
```

### 3. Input Validation

```javascript
// Mongoose validation
email: {
  type: String,
  required: true,
  validate: {
    validator: function(v) {
      return /^\S+@\S+\.\S+$/.test(v);
    },
    message: 'Invalid email format'
  }
}
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Database Performance**
   - Query execution time
   - Index usage
   - Collection sizes
   - Connection pool usage

2. **Business Metrics**
   - Active users
   - Items listed per day
   - Rentals completed
   - Revenue generated

3. **User Engagement**
   - Messages sent
   - Items viewed
   - Search queries
   - Conversion rates

### MongoDB Monitoring Commands

```javascript
// Check index usage
db.items.aggregate([
  { $indexStats: {} }
]);

// Explain query plan
db.items.find({ category: 'Tools' }).explain('executionStats');

// Collection stats
db.items.stats();
```

---

## Backup Strategy

### 1. Automated Backups

```bash
# Daily backup script
mongodump --uri="mongodb://localhost:27017/localloop" \
  --out=/backups/$(date +%Y%m%d)

# Backup with compression
mongodump --uri="mongodb://localhost:27017/localloop" \
  --gzip --archive=/backups/localloop_$(date +%Y%m%d).gz
```

### 2. Point-in-Time Recovery

- Enable MongoDB oplog
- Configure continuous backup
- Test restore procedures regularly

---

## Migration Strategy

### Schema Versioning

```javascript
const userSchema = new mongoose.Schema({
  // ... fields
  schemaVersion: {
    type: Number,
    default: 1
  }
});

// Migration function
async function migrateUsers() {
  const users = await User.find({ schemaVersion: { $lt: 2 } });
  
  for (const user of users) {
    // Apply migration logic
    user.schemaVersion = 2;
    await user.save();
  }
}
```

---

## Conclusion

This database architecture provides:

✅ **Scalability** - Sharding-ready design
✅ **Performance** - Optimized indexes and queries
✅ **Security** - Encrypted data, validation
✅ **Maintainability** - Clean schema design
✅ **Flexibility** - Easy to extend and modify

The design supports millions of users while maintaining query performance and data integrity.
