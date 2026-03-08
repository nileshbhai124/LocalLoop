# LocalLoop Database Query Reference

Quick reference guide for common database operations in LocalLoop.

## User Operations

### Create User
```javascript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  location: {
    type: 'Point',
    coordinates: [-122.4194, 37.7749],
    address: '123 Main St',
    city: 'San Francisco'
  }
});
```

### Find User by Email
```javascript
const user = await User.findOne({ email: 'john@example.com' })
  .select('+password'); // Include password for authentication
```

### Update User Profile
```javascript
const user = await User.findByIdAndUpdate(
  userId,
  {
    name: 'John Updated',
    bio: 'New bio',
    'location.city': 'Oakland'
  },
  { new: true, runValidators: true }
);
```

### Get User with Items
```javascript
const user = await User.findById(userId)
  .populate({
    path: 'items',
    match: { availabilityStatus: 'available' },
    options: { limit: 10, sort: { createdAt: -1 } }
  });
```

---

## Item Operations

### Create Item
```javascript
const item = await Item.create({
  title: 'Power Drill',
  description: 'Professional cordless drill',
  category: 'Tools',
  condition: 'like-new',
  pricePerDay: 15,
  images: [
    { url: 'https://...', publicId: 'abc123', isPrimary: true }
  ],
  owner: userId,
  location: {
    type: 'Point',
    coordinates: [-122.4194, 37.7749],
    address: '123 Main St',
    city: 'San Francisco'
  }
});
```

### Find Nearby Items
```javascript
const items = await Item.find({
  'location.coordinates': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: 10000 // 10km in meters
    }
  },
  availabilityStatus: 'available'
})
.populate('owner', 'name avatar ratingAverage')
.limit(20);
```

### Search Items by Text
```javascript
const items = await Item.find({
  $text: { $search: 'drill power tool' },
  category: 'Tools',
  pricePerDay: { $lte: 50 }
})
.select({ score: { $meta: 'textScore' } })
.sort({ score: { $meta: 'textScore' } })
.limit(20);
```

### Filter Items with Multiple Criteria
```javascript
const items = await Item.find({
  category: 'Electronics',
  condition: { $in: ['new', 'like-new'] },
  pricePerDay: { $gte: 10, $lte: 100 },
  availabilityStatus: 'available',
  'location.city': 'San Francisco'
})
.sort({ ratingAverage: -1, views: -1 })
.skip(page * limit)
.limit(limit);
```

### Update Item Availability
```javascript
await Item.findByIdAndUpdate(itemId, {
  availabilityStatus: 'rented',
  $push: {
    unavailableDates: {
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-20')
    }
  }
});
```

### Increment Item Views
```javascript
await Item.findByIdAndUpdate(itemId, {
  $inc: { views: 1 }
});
```

---

## Rental Operations

### Create Rental Request
```javascript
const rental = await Rental.create({
  itemId: itemId,
  ownerId: ownerId,
  borrowerId: userId,
  startDate: new Date('2024-03-15'),
  endDate: new Date('2024-03-20'),
  pricePerDay: 15,
  totalDays: 5,
  totalPrice: 75,
  status: 'pending',
  requestMessage: 'Need this for a project'
});
```

### Get User's Rentals
```javascript
// As borrower
const rentals = await Rental.find({
  borrowerId: userId,
  status: { $in: ['active', 'approved'] }
})
.populate('itemId', 'title images pricePerDay')
.populate('ownerId', 'name avatar')
.sort({ startDate: -1 });

// As owner
const rentals = await Rental.find({
  ownerId: userId,
  status: 'pending'
})
.populate('itemId', 'title images')
.populate('borrowerId', 'name avatar')
.sort({ createdAt: -1 });
```

### Update Rental Status
```javascript
const rental = await Rental.findByIdAndUpdate(
  rentalId,
  {
    status: 'approved',
    approvedAt: new Date(),
    $push: {
      statusHistory: {
        status: 'approved',
        timestamp: new Date(),
        note: 'Approved by owner'
      }
    }
  },
  { new: true }
);
```

### Get Rental Statistics
```javascript
const stats = await Rental.aggregate([
  { $match: { ownerId: mongoose.Types.ObjectId(userId), status: 'completed' } },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: '$totalPrice' },
      totalRentals: { $sum: 1 },
      avgRentalPrice: { $avg: '$totalPrice' }
    }
  }
]);
```

---

## Message Operations

### Send Message
```javascript
const message = await Message.create({
  senderId: userId,
  receiverId: receiverId,
  itemId: itemId,
  messageText: 'Is this item still available?',
  messageType: 'text'
});
```

### Get Conversation
```javascript
const messages = await Message.find({
  $or: [
    { senderId: user1Id, receiverId: user2Id },
    { senderId: user2Id, receiverId: user1Id }
  ]
})
.sort({ timestamp: -1 })
.limit(50)
.populate('senderId', 'name avatar')
.populate('receiverId', 'name avatar');
```

### Get Conversations List
```javascript
const conversations = await Message.aggregate([
  {
    $match: {
      $or: [
        { senderId: mongoose.Types.ObjectId(userId) },
        { receiverId: mongoose.Types.ObjectId(userId) }
      ]
    }
  },
  { $sort: { timestamp: -1 } },
  {
    $group: {
      _id: {
        $cond: [
          { $eq: ['$senderId', mongoose.Types.ObjectId(userId)] },
          '$receiverId',
          '$senderId'
        ]
      },
      lastMessage: { $first: '$$ROOT' },
      unreadCount: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ['$receiverId', mongoose.Types.ObjectId(userId)] },
                { $eq: ['$readStatus', false] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'participant'
    }
  },
  { $unwind: '$participant' }
]);
```

### Mark Messages as Read
```javascript
await Message.updateMany(
  {
    senderId: senderId,
    receiverId: userId,
    readStatus: false
  },
  {
    readStatus: true,
    readAt: new Date()
  }
);
```

---

## Review Operations

### Create Review
```javascript
const review = await Review.create({
  reviewerId: userId,
  reviewedUserId: reviewedUserId,
  itemId: itemId,
  rentalId: rentalId,
  reviewType: 'borrower-to-owner',
  rating: 5,
  comment: 'Great experience!',
  detailedRatings: {
    communication: 5,
    condition: 5,
    punctuality: 5,
    overall: 5
  }
});

// Update user rating
const reviews = await Review.find({ reviewedUserId: reviewedUserId });
const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

await User.findByIdAndUpdate(reviewedUserId, {
  ratingAverage: avgRating,
  totalReviews: reviews.length
});
```

### Get User Reviews
```javascript
const reviews = await Review.find({ reviewedUserId: userId })
  .populate('reviewerId', 'name avatar')
  .populate('itemId', 'title')
  .sort({ createdAt: -1 })
  .limit(10);
```

### Get Item Reviews
```javascript
const reviews = await Review.find({ itemId: itemId })
  .populate('reviewerId', 'name avatar')
  .sort({ rating: -1, createdAt: -1 });
```

---

## Notification Operations

### Create Notification
```javascript
const notification = await Notification.create({
  userId: userId,
  type: 'borrow_request',
  title: 'New Borrow Request',
  message: 'John wants to borrow your drill',
  relatedItem: itemId,
  relatedRental: rentalId,
  relatedUser: borrowerId,
  priority: 'high'
});
```

### Get User Notifications
```javascript
const notifications = await Notification.find({
  userId: userId,
  isRead: false
})
.populate('relatedItem', 'title images')
.populate('relatedUser', 'name avatar')
.sort({ createdAt: -1 })
.limit(20);
```

### Mark Notification as Read
```javascript
await Notification.findByIdAndUpdate(notificationId, {
  isRead: true,
  readAt: new Date()
});
```

### Mark All as Read
```javascript
await Notification.updateMany(
  { userId: userId, isRead: false },
  { isRead: true, readAt: new Date() }
);
```

---

## Advanced Queries

### Get Popular Items
```javascript
const popularItems = await Item.find({
  availabilityStatus: 'available'
})
.sort({ views: -1, ratingAverage: -1 })
.limit(10)
.populate('owner', 'name avatar');
```

### Get User Dashboard Stats
```javascript
const stats = await Promise.all([
  Item.countDocuments({ owner: userId }),
  Rental.countDocuments({ borrowerId: userId, status: 'active' }),
  Rental.aggregate([
    { $match: { ownerId: mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]),
  Message.countDocuments({ receiverId: userId, readStatus: false })
]);

const dashboard = {
  itemsListed: stats[0],
  activeBorrows: stats[1],
  totalEarnings: stats[2][0]?.total || 0,
  unreadMessages: stats[3]
};
```

### Search with Filters and Pagination
```javascript
const query = {
  availabilityStatus: 'available'
};

if (category) query.category = category;
if (minPrice || maxPrice) {
  query.pricePerDay = {};
  if (minPrice) query.pricePerDay.$gte = minPrice;
  if (maxPrice) query.pricePerDay.$lte = maxPrice;
}
if (searchText) {
  query.$text = { $search: searchText };
}

const items = await Item.find(query)
  .populate('owner', 'name avatar ratingAverage')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);

const total = await Item.countDocuments(query);
```

---

## Performance Tips

1. **Use `.lean()`** for read-only queries (faster)
```javascript
const items = await Item.find(query).lean();
```

2. **Select only needed fields**
```javascript
const users = await User.find().select('name email avatar');
```

3. **Use indexes** for frequently queried fields
```javascript
// Already defined in schemas
```

4. **Batch operations** when possible
```javascript
await Item.bulkWrite([
  { updateOne: { filter: { _id: id1 }, update: { $inc: { views: 1 } } } },
  { updateOne: { filter: { _id: id2 }, update: { $inc: { views: 1 } } } }
]);
```

5. **Use aggregation** for complex calculations
```javascript
const result = await Rental.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$ownerId', total: { $sum: '$totalPrice' } } }
]);
```
