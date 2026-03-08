# LocalLoop Real-Time Chat System Architecture

## Overview

Production-ready real-time chat system built with Socket.io, supporting scalable messaging, typing indicators, read receipts, and conversation management.

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ WebSocket Connection
       │ (Socket.io)
       ▼
┌─────────────────────┐
│  Socket.io Server   │
│  - Auth Middleware  │
│  - Event Handlers   │
│  - User Tracking    │
└──────┬──────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│   MongoDB   │  │    Redis    │
│  Messages   │  │  Pub/Sub    │
│Conversations│  │  Sessions   │
└─────────────┘  └─────────────┘
```

## Technology Stack

- **Real-time**: Socket.io 4.6+
- **Database**: MongoDB with Mongoose
- **Caching**: Redis (for scaling)
- **Authentication**: JWT
- **Message Queue**: Redis Pub/Sub

---

## System Components

### 1. Socket Server Setup

**File**: `server/sockets/socketServer.js`

Features:
- JWT authentication middleware
- Connection management
- Event routing
- Error handling
- Graceful shutdown

### 2. User Session Management

**Active Users Map**:
```javascript
{
  userId: {
    socketId: 'socket_abc123',
    status: 'online',
    lastActivity: Date,
    metadata: {}
  }
}
```

### 3. Message Flow

```
User A → sendMessage → Server → Save to DB → 
Emit to User B → receiveMessage → Update UI
```

---

## Socket.io Events

### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `authenticate` | Authenticate user | `{ token }` |
| `sendMessage` | Send a message | `{ receiverId, message, itemId? }` |
| `typing` | User is typing | `{ receiverId }` |
| `stopTyping` | User stopped typing | `{ receiverId }` |
| `markAsRead` | Mark messages as read | `{ senderId }` |
| `joinConversation` | Join conversation room | `{ conversationId }` |
| `leaveConversation` | Leave conversation room | `{ conversationId }` |

### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `authenticated` | Auth successful | `{ userId }` |
| `authError` | Auth failed | `{ message }` |
| `receiveMessage` | New message | `{ message }` |
| `messageSent` | Message sent confirmation | `{ message }` |
| `messageError` | Message send failed | `{ error }` |
| `userTyping` | User is typing | `{ userId }` |
| `userStoppedTyping` | User stopped typing | `{ userId }` |
| `messagesRead` | Messages marked as read | `{ userId }` |
| `userOnline` | User came online | `{ userId }` |
| `userOffline` | User went offline | `{ userId }` |
| `conversationUpdated` | Conversation changed | `{ conversation }` |

---

## Database Schemas

### Message Schema

```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  conversation: ObjectId (ref: Conversation),
  itemId: ObjectId (ref: Item, optional),
  messageText: String,
  messageType: 'text' | 'image' | 'file' | 'system',
  attachments: [{
    url: String,
    type: String,
    filename: String,
    size: Number
  }],
  readStatus: Boolean,
  readAt: Date,
  deliveredAt: Date,
  isDeleted: Boolean,
  deletedBy: [ObjectId],
  timestamp: Date,
  metadata: Mixed
}
```

### Conversation Schema

```javascript
{
  _id: ObjectId,
  participants: [ObjectId (ref: User)],
  itemId: ObjectId (ref: Item, optional),
  lastMessage: {
    text: String,
    sender: ObjectId,
    timestamp: Date
  },
  unreadCount: {
    userId1: Number,
    userId2: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Scalability Strategy

### 1. Redis Adapter for Clustering

```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Benefits**:
- Multiple server instances
- Load balancing
- Horizontal scaling
- Session persistence

### 2. Message Queue

Use Redis for:
- Offline message queue
- Notification queue
- Analytics events

### 3. Database Optimization

**Indexes**:
```javascript
// Messages
{ sender: 1, receiver: 1, timestamp: -1 }
{ conversation: 1, timestamp: -1 }
{ readStatus: 1, receiver: 1 }

// Conversations
{ participants: 1 }
{ 'lastMessage.timestamp': -1 }
```

**Sharding Strategy**:
- Shard by `conversation._id`
- Ensures related messages on same shard

---

## Security Measures

### 1. Authentication

```javascript
// JWT verification on socket connection
socket.on('authenticate', async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.emit('authenticated', { userId: decoded.id });
  } catch (error) {
    socket.emit('authError', { message: 'Invalid token' });
    socket.disconnect();
  }
});
```

### 2. Authorization

- Verify sender/receiver relationship
- Check conversation membership
- Validate item access

### 3. Rate Limiting

```javascript
const messageRateLimiter = {
  maxMessages: 10,
  windowMs: 60000, // 1 minute
  userLimits: new Map()
};
```

### 4. Input Sanitization

```javascript
const sanitizeMessage = (text) => {
  return text
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .substring(0, 1000); // Max length
};
```

---

## Performance Optimization

### 1. Connection Pooling

```javascript
mongoose.connect(uri, {
  maxPoolSize: 50,
  minPoolSize: 10
});
```

### 2. Message Batching

```javascript
// Batch read receipts
const batchReadReceipts = debounce((receipts) => {
  Message.updateMany(
    { _id: { $in: receipts } },
    { readStatus: true, readAt: new Date() }
  );
}, 1000);
```

### 3. Caching

```javascript
// Cache active conversations
const conversationCache = new Map();
const CACHE_TTL = 300000; // 5 minutes
```

---

## Message Features

### 1. Typing Indicators

```javascript
// Client sends typing event
socket.emit('typing', { receiverId });

// Server broadcasts to receiver
io.to(receiverSocketId).emit('userTyping', { userId });

// Auto-stop after 3 seconds
setTimeout(() => {
  socket.emit('stopTyping', { receiverId });
}, 3000);
```

### 2. Read Receipts

```javascript
// Mark as read when user views message
socket.emit('markAsRead', { senderId });

// Update database
await Message.updateMany(
  { sender: senderId, receiver: userId, readStatus: false },
  { readStatus: true, readAt: new Date() }
);

// Notify sender
io.to(senderSocketId).emit('messagesRead', { userId });
```

### 3. Delivery Status

```javascript
// Message states
- sent: Saved to database
- delivered: Received by server
- read: Viewed by recipient
```

### 4. File Attachments

```javascript
// Upload file first via REST API
POST /api/upload

// Then send message with attachment
{
  messageText: 'Check this out',
  attachments: [{
    url: 'https://cloudinary.com/file.pdf',
    type: 'application/pdf',
    filename: 'document.pdf',
    size: 1024000
  }]
}
```

---

## API Endpoints

### REST API for Chat History

```
GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations
DELETE /api/conversations/:id

GET    /api/messages/:conversationId
POST   /api/messages
PUT    /api/messages/:id/read
DELETE /api/messages/:id

GET    /api/messages/search?q=query
GET    /api/messages/unread/count
```

---

## Error Handling

### Socket Errors

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  socket.emit('error', { message: 'Connection error' });
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Message Errors

```javascript
try {
  await Message.create(messageData);
} catch (error) {
  socket.emit('messageError', {
    message: 'Failed to send message',
    error: error.message
  });
}
```

---

## Monitoring & Analytics

### Metrics to Track

1. **Connection Metrics**
   - Active connections
   - Connection duration
   - Reconnection rate

2. **Message Metrics**
   - Messages per second
   - Average delivery time
   - Failed messages

3. **User Metrics**
   - Active users
   - Peak concurrent users
   - Average session duration

### Logging

```javascript
const logger = {
  connection: (userId, socketId) => {
    console.log(`User ${userId} connected: ${socketId}`);
  },
  message: (from, to, messageId) => {
    console.log(`Message ${messageId}: ${from} → ${to}`);
  },
  error: (error, context) => {
    console.error(`Error in ${context}:`, error);
  }
};
```

---

## Testing

### Unit Tests

```javascript
describe('Socket.io Chat', () => {
  it('should authenticate user', (done) => {
    const client = io('http://localhost:3002');
    client.emit('authenticate', validToken);
    client.on('authenticated', (data) => {
      expect(data.userId).toBeDefined();
      done();
    });
  });

  it('should send message', (done) => {
    client.emit('sendMessage', {
      receiverId: 'user123',
      message: 'Hello'
    });
    client.on('messageSent', (data) => {
      expect(data.message).toBeDefined();
      done();
    });
  });
});
```

### Load Testing

```javascript
// Use Socket.io-client for load testing
const clients = [];
for (let i = 0; i < 1000; i++) {
  const client = io('http://localhost:3002');
  clients.push(client);
}
```

---

## Deployment Considerations

### 1. WebSocket Support

Ensure hosting platform supports WebSockets:
- Heroku: Enable WebSocket support
- AWS: Use ALB with WebSocket support
- DigitalOcean: Configure Nginx

### 2. Nginx Configuration

```nginx
location /socket.io/ {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### 3. Environment Variables

```env
SOCKET_IO_PORT=3002
REDIS_URL=redis://localhost:6379
SOCKET_IO_CORS_ORIGIN=https://localloop.com
SOCKET_IO_PING_TIMEOUT=60000
SOCKET_IO_PING_INTERVAL=25000
```

---

## Best Practices

1. **Always authenticate** before allowing socket operations
2. **Validate all inputs** from clients
3. **Use rooms** for conversation isolation
4. **Implement reconnection** logic on client
5. **Handle offline scenarios** gracefully
6. **Monitor performance** continuously
7. **Log security events**
8. **Rate limit** message sending
9. **Sanitize** message content
10. **Test at scale** before production

---

## Future Enhancements

- [ ] Voice messages
- [ ] Video calls
- [ ] Group chats
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Message search
- [ ] End-to-end encryption
- [ ] Message scheduling
- [ ] Auto-delete messages
- [ ] Chat bots

---

## Support

For real-time chat issues:
- Check Socket.io connection status
- Verify JWT token validity
- Review server logs
- Monitor Redis connection
- Check database indexes
