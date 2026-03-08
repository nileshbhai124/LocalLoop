# LocalLoop Backend API

Production-ready backend for LocalLoop neighborhood sharing platform.

## Tech Stack

- **Framework**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Token)
- **Real-Time**: Socket.io
- **Image Storage**: Cloudinary
- **Security**: bcrypt, helmet, cors, express-rate-limit

## Features

✅ User authentication & authorization
✅ Item listing & management
✅ Rental request system
✅ Real-time messaging
✅ Review & rating system
✅ Notifications
✅ Image upload to Cloudinary
✅ Geospatial search
✅ Rate limiting
✅ Input validation
✅ Error handling
✅ Pagination

## Project Structure

```
server/
├── config/
│   ├── database.js          # MongoDB connection
│   └── cloudinary.js        # Cloudinary configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── itemController.js    # Item CRUD operations
│   ├── rentalController.js  # Rental management
│   ├── messageController.js # Messaging logic
│   ├── reviewController.js  # Review system
│   ├── userController.js    # User management
│   ├── notificationController.js
│   └── uploadController.js  # Image uploads
├── models/
│   ├── User.js             # User schema
│   ├── Item.js             # Item schema
│   ├── Rental.js           # Rental schema
│   ├── Message.js          # Message schema
│   ├── Review.js           # Review schema
│   └── Notification.js     # Notification schema
├── routes/
│   ├── authRoutes.js
│   ├── itemRoutes.js
│   ├── rentalRoutes.js
│   ├── messageRoutes.js
│   ├── reviewRoutes.js
│   ├── userRoutes.js
│   ├── notificationRoutes.js
│   └── uploadRoutes.js
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── validation.js       # Input validation
│   └── rateLimiter.js      # Rate limiting
├── sockets/
│   └── chatSocket.js       # Socket.io chat logic
├── utils/
│   ├── errorHandler.js     # Error handling
│   ├── response.js         # API response formatter
│   └── jwt.js              # JWT utilities
├── .env.example
├── .gitignore
├── package.json
└── server.js               # Entry point
```

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/localloop
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

4. Start MongoDB (if running locally)

5. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile (Private)
- `PUT /api/users/profile` - Update profile (Private)
- `GET /api/users/:id` - Get user by ID

### Items
- `POST /api/items` - Create item (Private)
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/:id` - Get single item
- `PUT /api/items/:id` - Update item (Private)
- `DELETE /api/items/:id` - Delete item (Private)
- `GET /api/items/user/:userId` - Get user's items

### Rentals
- `POST /api/rentals/request` - Create rental request (Private)
- `GET /api/rentals/user` - Get user rentals (Private)
- `PUT /api/rentals/:id/approve` - Approve rental (Private)
- `PUT /api/rentals/:id/reject` - Reject rental (Private)
- `PUT /api/rentals/:id/complete` - Complete rental (Private)

### Messages
- `GET /api/messages/conversations` - Get conversations (Private)
- `GET /api/messages/:userId` - Get messages with user (Private)
- `POST /api/messages` - Send message (Private)
- `PUT /api/messages/read/:userId` - Mark as read (Private)

### Reviews
- `POST /api/reviews` - Create review (Private)
- `GET /api/reviews/:userId` - Get user reviews

### Notifications
- `GET /api/notifications` - Get notifications (Private)
- `PUT /api/notifications/:id/read` - Mark as read (Private)
- `PUT /api/notifications/read-all` - Mark all as read (Private)
- `DELETE /api/notifications/:id` - Delete notification (Private)

### Upload
- `POST /api/upload` - Upload images (Private)
- `DELETE /api/upload/:publicId` - Delete image (Private)

## Socket.io Events

### Client → Server
- `authenticate` - Authenticate with JWT token
- `sendMessage` - Send a message
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `markAsRead` - Mark messages as read

### Server → Client
- `authenticated` - Authentication successful
- `receiveMessage` - New message received
- `messageSent` - Message sent confirmation
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User is typing
- `userStoppedTyping` - User stopped typing
- `messagesRead` - Messages marked as read

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Helmet for security headers
- CORS configuration
- Rate limiting
- Input validation & sanitization
- MongoDB injection prevention

## Error Handling

All errors return consistent JSON format:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

## Pagination Response

```json
{
  "success": true,
  "message": "Success message",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "pages": 5
  }
}
```

## Database Indexes

Optimized indexes for:
- Text search on items
- Geospatial queries
- User lookups
- Rental status filtering
- Message conversations

## Performance Optimizations

- Response compression
- Query pagination
- Database indexing
- Cloudinary image optimization
- Connection pooling

## Testing

```bash
npm test
```

## Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT_SECRET
4. Configure Cloudinary credentials
5. Deploy to your hosting platform

## License

MIT
