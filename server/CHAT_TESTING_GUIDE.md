# Real-Time Chat System Testing Guide

## Overview
This guide provides comprehensive testing procedures for the LocalLoop real-time chat system built with Socket.io.

## Prerequisites
- Server running on http://localhost:3002
- Two authenticated users (JWT tokens)
- Socket.io client library
- REST API client (Postman/curl)

---

## 1. Socket.io Connection Testing

### Test 1.1: Basic Connection
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3002');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

**Expected Result**: Connection established successfully

### Test 1.2: JWT Authentication
```javascript
const token = 'your_jwt_token_here';

socket.emit('authenticate', token);

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId);
});

socket.on('authError', (error) => {
  console.error('Auth failed:', error.message);
});
```

**Expected Result**: User authenticated, userId returned

### Test 1.3: Invalid Token
```javascript
socket.emit('authenticate', 'invalid_token');
```

**Expected Result**: authError event, socket disconnected

---

## 2. Message Sending & Receiving

### Test 2.1: Send Message
```javascript
socket.emit('sendMessage', {
  receiver: 'receiver_user_id',
  message: 'Hello, this is a test message',
  itemId: 'optional_item_id'
});

socket.on('messageSent', (message) => {
  console.log('Message sent:', message);
});

socket.on('messageError', (error) => {
  console.error('Error:', error.message);
});
```

**Expected Result**: Message saved to database, messageSent event received

### Test 2.2: Receive Message
```javascript
// On receiver's socket
socket.on('receiveMessage', (message) => {
  console.log('New message:', message);
  console.log('From:', message.sender.name);
  console.log('Text:', message.message);
});
```

**Expected Result**: Message received in real-time with populated sender info

### Test 2.3: Offline Message Delivery
1. User A sends message to User B (offline)
2. User B connects and authenticates

```javascript
socket.on('pendingMessages', (messages) => {
  console.log('Pending messages:', messages.length);
  messages.forEach(msg => console.log(msg));
});
```

**Expected Result**: Pending messages delivered on connection

---

## 3. Rate Limiting

### Test 3.1: Message Rate Limit
```javascript
// Send 11 messages rapidly
for (let i = 0; i < 11; i++) {
  socket.emit('sendMessage', {
    receiver: 'receiver_id',
    message: `Message ${i}`
  });
}
```

**Expected Result**: First 10 succeed, 11th returns rate limit error

---

## 4. Typing Indicators

### Test 4.1: Start Typing
```javascript
socket.emit('typing', {
  receiver: 'receiver_user_id',
  conversationId: 'conversation_id'
});

// On receiver's socket
socket.on('userTyping', (data) => {
  console.log('User typing:', data.userId);
});
```

**Expected Result**: Receiver sees typing indicator

### Test 4.2: Stop Typing
```javascript
socket.emit('stopTyping', {
  receiver: 'receiver_user_id',
  conversationId: 'conversation_id'
});

// On receiver's socket
socket.on('userStoppedTyping', (data) => {
  console.log('User stopped typing:', data.userId);
});
```

**Expected Result**: Typing indicator removed

---

## 5. Read Receipts

### Test 5.1: Mark Messages as Read
```javascript
socket.emit('markAsRead', {
  senderId: 'sender_user_id',
  conversationId: 'conversation_id'
});

// On sender's socket
socket.on('messagesRead', (data) => {
  console.log('Messages read by:', data.userId);
  console.log('Count:', data.count);
});
```

**Expected Result**: Messages marked as read in database, sender notified

---

## 6. Online/Offline Status

### Test 6.1: User Goes Online
```javascript
// On other users' sockets
socket.on('userOnline', (data) => {
  console.log('User online:', data.userId);
});
```

**Expected Result**: All connected users notified

### Test 6.2: User Goes Offline
```javascript
socket.disconnect();

// On other users' sockets
socket.on('userOffline', (data) => {
  console.log('User offline:', data.userId);
});
```

**Expected Result**: All connected users notified

### Test 6.3: Check Online Status
```javascript
socket.emit('getOnlineStatus', {
  userIds: ['user1_id', 'user2_id', 'user3_id']
});

socket.on('onlineStatus', (status) => {
  console.log('Online status:', status);
  // { user1_id: true, user2_id: false, user3_id: true }
});
```

**Expected Result**: Online status for all requested users

---

## 7. Conversation Management

### Test 7.1: Join Conversation Room
```javascript
socket.emit('joinConversation', {
  conversationId: 'conversation_id'
});
```

**Expected Result**: User joined conversation room

### Test 7.2: Leave Conversation Room
```javascript
socket.emit('leaveConversation', {
  conversationId: 'conversation_id'
});
```

**Expected Result**: User left conversation room

---

## 8. REST API Testing

### Test 8.1: Get All Conversations
```bash
curl -X GET http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: List of conversations with pagination

### Test 8.2: Create Conversation
```bash
curl -X POST http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "other_user_id",
    "itemId": "optional_item_id"
  }'
```

**Expected Result**: New conversation created or existing returned

### Test 8.3: Get Single Conversation
```bash
curl -X GET http://localhost:3002/api/conversations/CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: Conversation details with participants

### Test 8.4: Archive Conversation
```bash
curl -X PUT http://localhost:3002/api/conversations/CONVERSATION_ID/archive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: Conversation archived for user

### Test 8.5: Get Unread Count
```bash
curl -X GET http://localhost:3002/api/conversations/unread/count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: Total unread messages count

### Test 8.6: Get Messages
```bash
curl -X GET "http://localhost:3002/api/messages?conversationId=CONVERSATION_ID&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: Paginated message history

---

## 9. Security Testing

### Test 9.1: Unauthenticated Socket
```javascript
socket.emit('sendMessage', {
  receiver: 'user_id',
  message: 'Test'
});
```

**Expected Result**: messageError - Not authenticated

### Test 9.2: XSS Prevention
```javascript
socket.emit('sendMessage', {
  receiver: 'user_id',
  message: '<script>alert("XSS")</script>'
});
```

**Expected Result**: Script tags removed from message

### Test 9.3: Message Length Limit
```javascript
const longMessage = 'a'.repeat(1001);
socket.emit('sendMessage', {
  receiver: 'user_id',
  message: longMessage
});
```

**Expected Result**: Message truncated to 1000 characters

### Test 9.4: Unauthorized Conversation Access
```bash
curl -X GET http://localhost:3002/api/conversations/OTHER_USER_CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: 403 Forbidden

---

## 10. Heartbeat & Activity Tracking

### Test 10.1: Send Heartbeat
```javascript
setInterval(() => {
  socket.emit('heartbeat');
}, 30000); // Every 30 seconds
```

**Expected Result**: User activity timestamp updated

### Test 10.2: Inactive User Cleanup
1. Connect user
2. Stop sending heartbeats
3. Wait 5+ minutes

**Expected Result**: User removed from active users, userOffline event emitted

---

## 11. Conversation Updates

### Test 11.1: Real-time Conversation Update
```javascript
socket.on('conversationUpdated', (data) => {
  console.log('Conversation updated:', data.conversationId);
  console.log('Last message:', data.lastMessage);
});
```

**Expected Result**: Both participants receive conversation update when message sent

---

## 12. Error Handling

### Test 12.1: Invalid Receiver
```javascript
socket.emit('sendMessage', {
  receiver: 'invalid_user_id',
  message: 'Test'
});
```

**Expected Result**: messageError event

### Test 12.2: Empty Message
```javascript
socket.emit('sendMessage', {
  receiver: 'user_id',
  message: ''
});
```

**Expected Result**: messageError - Invalid message content

### Test 12.3: Missing Required Fields
```javascript
socket.emit('sendMessage', {
  message: 'Test'
});
```

**Expected Result**: messageError - Receiver required

---

## 13. Load Testing

### Test 13.1: Multiple Concurrent Connections
```javascript
const connections = [];
for (let i = 0; i < 100; i++) {
  const socket = io('http://localhost:3002');
  connections.push(socket);
}
```

**Expected Result**: All connections established successfully

### Test 13.2: Message Throughput
Send 1000 messages and measure delivery time

**Expected Result**: All messages delivered within acceptable time

---

## 14. Integration Testing

### Complete Chat Flow Test
1. User A authenticates
2. User B authenticates
3. User A creates conversation with User B
4. User A sends message
5. User B receives message in real-time
6. User B starts typing
7. User A sees typing indicator
8. User B sends reply
9. User A marks messages as read
10. User B receives read receipt
11. Check conversation list shows latest message
12. Check unread count updated correctly

---

## Testing Tools

### Socket.io Client (Node.js)
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3002');
```

### Socket.io Client (Browser)
```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
</script>
```

### Postman Collection
Import the API endpoints for REST testing

---

## Common Issues & Solutions

### Issue: Socket not connecting
- Check server is running
- Verify CORS settings
- Check firewall rules

### Issue: Authentication failing
- Verify JWT token is valid
- Check token format: Bearer token
- Ensure user exists in database

### Issue: Messages not delivering
- Check both users are authenticated
- Verify receiver ID is correct
- Check rate limiting

### Issue: Typing indicators not working
- Ensure conversationId is provided
- Check receiver is online
- Verify socket connection

---

## Performance Benchmarks

### Expected Performance
- Connection time: < 100ms
- Message delivery: < 50ms (online users)
- Typing indicator latency: < 30ms
- Read receipt latency: < 50ms
- API response time: < 200ms

### Monitoring
- Track active connections
- Monitor message throughput
- Watch memory usage
- Check database query performance

---

## Next Steps

1. Implement Redis adapter for horizontal scaling
2. Add file attachment support
3. Implement message search
4. Add message reactions
5. Implement voice/video call signaling
6. Add end-to-end encryption
7. Implement message editing/deletion
8. Add group chat support

---

## Support

For issues or questions:
- Check server logs
- Review Socket.io documentation
- Test with Socket.io debugging enabled: `localStorage.debug = '*'`
