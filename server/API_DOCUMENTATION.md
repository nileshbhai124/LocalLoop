# LocalLoop API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "rating": 0,
      "reviewCount": 0
    }
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
```
**Headers:** `Authorization: Bearer <token>`

---

## Item Endpoints

### Create Item
```http
POST /api/items
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Power Drill",
  "description": "Professional cordless drill",
  "category": "Tools",
  "condition": "like-new",
  "pricePerDay": 15,
  "images": [
    {
      "url": "https://cloudinary.com/image.jpg",
      "publicId": "localloop/abc123"
    }
  ],
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St",
    "city": "San Francisco"
  }
}
```

### Get All Items (with filters)
```http
GET /api/items?page=1&limit=12&category=Tools&minPrice=10&maxPrice=50&lat=37.7749&lng=-122.4194&distance=10&search=drill
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 12)
- `category` (Tools, Electronics, Books, etc.)
- `minPrice` (number)
- `maxPrice` (number)
- `lat` (latitude for geospatial search)
- `lng` (longitude for geospatial search)
- `distance` (km, default: 50)
- `search` (text search)
- `availability` (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "pages": 5
  }
}
```

### Get Single Item
```http
GET /api/items/:id
```

### Update Item
```http
PUT /api/items/:id
```
**Headers:** `Authorization: Bearer <token>`

### Delete Item
```http
DELETE /api/items/:id
```
**Headers:** `Authorization: Bearer <token>`

### Get User's Items
```http
GET /api/items/user/:userId
```

---

## Rental Endpoints

### Create Rental Request
```http
POST /api/rentals/request
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "item": "item_id",
  "startDate": "2024-03-15",
  "endDate": "2024-03-20",
  "message": "I need this for a home project"
}
```

### Get User Rentals
```http
GET /api/rentals/user?type=borrower&status=pending
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (borrower or owner)
- `status` (pending, approved, active, completed, cancelled, rejected)

### Approve Rental
```http
PUT /api/rentals/:id/approve
```
**Headers:** `Authorization: Bearer <token>`

### Reject Rental
```http
PUT /api/rentals/:id/reject
```
**Headers:** `Authorization: Bearer <token>`

### Complete Rental
```http
PUT /api/rentals/:id/complete
```
**Headers:** `Authorization: Bearer <token>`

---

## Conversation Endpoints

### Get All Conversations
```http
GET /api/conversations?page=1&limit=20&archived=false
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `archived` (true/false, default: false)

**Response:**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "_id": "conversation_id",
      "participants": [
        {
          "_id": "user_id",
          "name": "Jane Doe",
          "avatar": "url",
          "isActive": true
        }
      ],
      "itemId": {
        "_id": "item_id",
        "title": "Power Drill",
        "images": [...]
      },
      "lastMessage": {
        "text": "Hello!",
        "sender": "user_id",
        "timestamp": "2024-03-10T10:00:00Z"
      },
      "unreadCount": 2,
      "otherParticipant": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### Get Single Conversation
```http
GET /api/conversations/:id
```
**Headers:** `Authorization: Bearer <token>`

### Create Conversation
```http
POST /api/conversations
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "participantId": "other_user_id",
  "itemId": "optional_item_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "_id": "conversation_id",
    "participants": [...],
    "itemId": {...}
  }
}
```

### Archive Conversation
```http
PUT /api/conversations/:id/archive
```
**Headers:** `Authorization: Bearer <token>`

### Unarchive Conversation
```http
PUT /api/conversations/:id/unarchive
```
**Headers:** `Authorization: Bearer <token>`

### Delete Conversation
```http
DELETE /api/conversations/:id
```
**Headers:** `Authorization: Bearer <token>`

### Get Unread Count
```http
GET /api/conversations/unread/count
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "totalUnread": 5,
    "conversationsWithUnread": 3
  }
}
```

---

## Message Endpoints

### Get Messages
```http
GET /api/messages?conversationId=conversation_id&page=1&limit=50
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `conversationId` (optional, filter by conversation)
- `page` (default: 1)
- `limit` (default: 50)

### Get Messages with User (Legacy)
```http
GET /api/messages/:userId
```
**Headers:** `Authorization: Bearer <token>`

### Send Message (REST - Legacy)
```http
POST /api/messages
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "receiver": "user_id",
  "message": "Hello, is the item still available?",
  "item": "item_id"
}
```

**Note:** For real-time messaging, use Socket.io events instead.

### Mark Messages as Read
```http
PUT /api/messages/read/:userId
```
**Headers:** `Authorization: Bearer <token>`

---

## Review Endpoints

### Create Review
```http
POST /api/reviews
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rental": "rental_id",
  "rating": 5,
  "comment": "Great experience! Item was as described."
}
```

### Get User Reviews
```http
GET /api/reviews/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": [
    {
      "_id": "review_id",
      "reviewer": {
        "name": "John Doe",
        "avatar": "url"
      },
      "rating": 5,
      "comment": "Great experience!",
      "createdAt": "2024-03-10T10:00:00Z"
    }
  ]
}
```

---

## Notification Endpoints

### Get Notifications
```http
GET /api/notifications?page=1&limit=20&read=false
```
**Headers:** `Authorization: Bearer <token>`

### Mark Notification as Read
```http
PUT /api/notifications/:id/read
```
**Headers:** `Authorization: Bearer <token>`

### Mark All as Read
```http
PUT /api/notifications/read-all
```
**Headers:** `Authorization: Bearer <token>`

### Delete Notification
```http
DELETE /api/notifications/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## User Endpoints

### Get Profile
```http
GET /api/users/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update Profile
```http
PUT /api/users/profile
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "bio": "Love sharing and helping neighbors",
  "avatar": "https://cloudinary.com/avatar.jpg",
  "location": {
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St",
    "city": "San Francisco"
  }
}
```

### Get User by ID
```http
GET /api/users/:id
```

---

## Upload Endpoints

### Upload Profile Picture
```http
POST /api/upload/profile
```
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form Data:**
- `avatar` (file, single, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "avatar": "https://res.cloudinary.com/...",
    "publicId": "localloop/users/user_123_1234567890"
  }
}
```

### Upload Item Images (Multiple)
```http
POST /api/upload/item
```
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form Data:**
- `images` (files, multiple, max 5 files, 5MB each)

**Response:**
```json
{
  "success": true,
  "message": "Item images uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "localloop/items/abc123",
      "width": 1200,
      "height": 900,
      "format": "webp"
    }
  ]
}
```

### Upload Single Item Image
```http
POST /api/upload/item/single
```
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form Data:**
- `image` (file, single, max 5MB)

### Upload Chat Attachment
```http
POST /api/upload/chat
```
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form Data:**
- `attachment` (file, single, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "localloop/messages/chat_123_1234567890",
    "thumbnail": "https://res.cloudinary.com/.../thumbnail"
  }
}
```

### Delete Image
```http
DELETE /api/upload/:publicId
```
**Headers:** `Authorization: Bearer <token>`

**Note:** Replace `/` in publicId with `-` for URL encoding.

**Example:** `/api/upload/localloop-items-abc123`

### Delete Multiple Images
```http
POST /api/upload/delete-multiple
```
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
```json
{
  "publicIds": ["localloop/items/abc123", "localloop/items/def456"]
}
```

### Get Responsive URLs
```http
GET /api/upload/responsive/:publicId?sizes=400,800,1200
```

**Response:**
```json
{
  "success": true,
  "message": "Responsive URLs generated successfully",
  "data": [
    {
      "width": 400,
      "url": "https://res.cloudinary.com/.../w_400/..."
    },
    {
      "width": 800,
      "url": "https://res.cloudinary.com/.../w_800/..."
    }
  ]
}
```

### Replace Item Image
```http
PUT /api/upload/item/:itemId/image/:imageIndex
```
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form Data:**
- `image` (file, single, max 5MB)

**Example:** `/api/upload/item/ITEM_ID/image/0` (replaces first image)

---

## Upload Endpoints

---

## Socket.io Events

### Connection & Authentication
```javascript
const socket = io('http://localhost:3002');

// Authenticate
socket.emit('authenticate', 'your_jwt_token');

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId);
});

socket.on('authError', (error) => {
  console.error('Auth failed:', error.message);
  // Socket will be disconnected
});
```

### Send Message
```javascript
socket.emit('sendMessage', {
  receiver: 'user_id',
  message: 'Hello!',
  itemId: 'optional_item_id'
});

socket.on('messageSent', (message) => {
  console.log('Message sent:', message);
});

socket.on('messageError', (error) => {
  console.error('Error:', error.message);
});
```

### Receive Message
```javascript
socket.on('receiveMessage', (message) => {
  console.log('New message:', message);
  // message includes populated sender info
});
```

### Pending Messages (Offline Delivery)
```javascript
socket.on('pendingMessages', (messages) => {
  console.log('Pending messages:', messages);
  // Delivered when user connects after being offline
});
```

### Typing Indicators
```javascript
// Start typing
socket.emit('typing', { 
  receiver: 'user_id',
  conversationId: 'conversation_id'
});

// Stop typing
socket.emit('stopTyping', { 
  receiver: 'user_id',
  conversationId: 'conversation_id'
});

// Listen for typing
socket.on('userTyping', (data) => {
  console.log('User is typing:', data.userId, data.conversationId);
});

socket.on('userStoppedTyping', (data) => {
  console.log('User stopped typing:', data.userId);
});
```

### Read Receipts
```javascript
// Mark messages as read
socket.emit('markAsRead', {
  senderId: 'sender_user_id',
  conversationId: 'conversation_id'
});

// Listen for read receipts
socket.on('messagesRead', (data) => {
  console.log('Messages read by:', data.userId);
  console.log('Count:', data.count);
});
```

### Online Status
```javascript
// User comes online
socket.on('userOnline', (data) => {
  console.log('User came online:', data.userId);
});

// User goes offline
socket.on('userOffline', (data) => {
  console.log('User went offline:', data.userId);
});

// Check online status
socket.emit('getOnlineStatus', {
  userIds: ['user1_id', 'user2_id']
});

socket.on('onlineStatus', (status) => {
  console.log('Online status:', status);
  // { user1_id: true, user2_id: false }
});
```

### Conversation Rooms
```javascript
// Join conversation room
socket.emit('joinConversation', {
  conversationId: 'conversation_id'
});

// Leave conversation room
socket.emit('leaveConversation', {
  conversationId: 'conversation_id'
});

// Listen for conversation updates
socket.on('conversationUpdated', (data) => {
  console.log('Conversation updated:', data.conversationId);
  console.log('Last message:', data.lastMessage);
});
```

### Heartbeat (Activity Tracking)
```javascript
// Send heartbeat every 30 seconds to maintain active status
setInterval(() => {
  socket.emit('heartbeat');
}, 30000);
```

### Rate Limiting
- Maximum 10 messages per minute per user
- Exceeding limit returns `messageError` event

### Security Features
- JWT authentication required
- Message sanitization (XSS prevention)
- Maximum message length: 1000 characters
- Automatic cleanup of inactive users (5 minutes)

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Upload endpoints: 20 requests per hour

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Items
```bash
curl -X GET "http://localhost:3001/api/items?page=1&limit=12"
```

### Create Item (with auth)
```bash
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Power Drill","description":"Professional drill","category":"Tools","condition":"like-new","pricePerDay":15,"location":{"coordinates":[-122.4194,37.7749],"address":"123 Main St","city":"San Francisco"}}'
```
