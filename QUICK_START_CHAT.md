# Quick Start Guide - Real-Time Chat System

## Installation Complete ✅

The chat system dependencies have been installed successfully!

## What Was Installed
- `socket.io-client@^4.7.2` - Client library for real-time communication

## Current Status
- ✅ Backend chat server ready (`server/sockets/chatSocket.js`)
- ✅ Frontend ChatWindow component ready (`components/ChatWindow.tsx`)
- ✅ Conversation API routes integrated (`/api/conversations`)
- ✅ Socket.io client installed
- ✅ No TypeScript errors

## Quick Test

### 1. Start Backend Server
```bash
cd server
npm run dev
```
Server will run on: http://localhost:3002

### 2. Start Frontend (in new terminal)
```bash
npm run dev
```
Frontend will run on: http://localhost:3001

### 3. Test Chat System

#### Option A: Use the ChatWindow Component
```tsx
import ChatWindow from '@/components/ChatWindow';

function TestChat() {
  return (
    <div className="h-screen p-4">
      <ChatWindow
        conversationId="test_conversation_id"
        receiverId="receiver_user_id"
        receiverName="John Doe"
        currentUserId="current_user_id"
        token="your_jwt_token"
      />
    </div>
  );
}
```

#### Option B: Test with Browser Console
```javascript
// Open browser console
const socket = io('http://localhost:3002');

// Authenticate
socket.emit('authenticate', 'your_jwt_token');

socket.on('authenticated', (data) => {
  console.log('✅ Connected:', data.userId);
});

// Send test message
socket.emit('sendMessage', {
  receiver: 'receiver_id',
  message: 'Hello from console!',
  conversationId: 'test_conv_id'
});

// Listen for messages
socket.on('receiveMessage', (msg) => {
  console.log('📨 New message:', msg);
});
```

## Environment Variables

### Backend (.env)
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/localloop
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## Testing Checklist

### Basic Tests
- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] Socket.io connection established
- [ ] JWT authentication works
- [ ] Messages send and receive in real-time

### Feature Tests
- [ ] Typing indicators appear
- [ ] Read receipts update
- [ ] Online/offline status accurate
- [ ] Offline messages delivered on reconnect
- [ ] Rate limiting prevents spam
- [ ] XSS protection works (try sending `<script>alert('test')</script>`)

## API Endpoints Available

### Conversations
```bash
# Get all conversations
curl http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create conversation
curl -X POST http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"user_id","itemId":"optional_item_id"}'

# Get unread count
curl http://localhost:3002/api/conversations/unread/count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Messages
```bash
# Get messages
curl "http://localhost:3002/api/messages?conversationId=CONV_ID&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Socket.io Events Reference

### Send Events (Client → Server)
```javascript
socket.emit('authenticate', token);
socket.emit('sendMessage', { receiver, message, conversationId });
socket.emit('typing', { receiver, conversationId });
socket.emit('stopTyping', { receiver, conversationId });
socket.emit('markAsRead', { senderId, conversationId });
socket.emit('joinConversation', { conversationId });
socket.emit('getOnlineStatus', { userIds: [...] });
socket.emit('heartbeat');
```

### Listen Events (Server → Client)
```javascript
socket.on('authenticated', (data) => { ... });
socket.on('receiveMessage', (message) => { ... });
socket.on('messageSent', (message) => { ... });
socket.on('userTyping', (data) => { ... });
socket.on('userStoppedTyping', (data) => { ... });
socket.on('messagesRead', (data) => { ... });
socket.on('userOnline', (data) => { ... });
socket.on('userOffline', (data) => { ... });
socket.on('onlineStatus', (status) => { ... });
socket.on('conversationUpdated', (data) => { ... });
socket.on('pendingMessages', (messages) => { ... });
```

## Troubleshooting

### Socket not connecting
```javascript
// Enable debug mode in browser console
localStorage.debug = '*';
// Reload page and check console
```

### CORS errors
Check `server/server.js` has correct CLIENT_URL:
```javascript
cors: {
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}
```

### Authentication failing
- Verify JWT token is valid
- Check token format: `Bearer <token>`
- Ensure user exists in database

### Messages not delivering
- Check both users are authenticated
- Verify receiver ID is correct
- Review rate limiting (max 10 msg/min)

## Documentation

For detailed information, see:
- `server/CHAT_SYSTEM_README.md` - Complete system overview
- `server/CHAT_TESTING_GUIDE.md` - Comprehensive testing
- `server/REALTIME_CHAT_ARCHITECTURE.md` - Architecture details
- `server/API_DOCUMENTATION.md` - API reference
- `CHAT_IMPLEMENTATION_COMPLETE.md` - Implementation summary

## Security Notes

### Production Checklist
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS
- [ ] Use secure WebSocket (wss://)
- [ ] Set proper CORS origins
- [ ] Enable rate limiting
- [ ] Add IP-based throttling
- [ ] Implement audit logging
- [ ] Use environment variables for secrets

### Current Security Features
- ✅ JWT authentication
- ✅ Message sanitization (XSS prevention)
- ✅ Rate limiting (10 msg/min)
- ✅ Message length limits (1000 chars)
- ✅ Authorization checks

## Next Steps

1. **Test the system**
   - Start both servers
   - Open two browser tabs
   - Login as different users
   - Send messages between them

2. **Integrate with your app**
   - Add ChatWindow to messages page
   - Connect to your auth system
   - Style to match your design

3. **Optional enhancements**
   - Add Redis adapter for scaling
   - Implement file attachments
   - Add message search
   - Enable push notifications

## Support

If you encounter issues:
1. Check server logs
2. Enable Socket.io debugging: `localStorage.debug = '*'`
3. Review browser console for errors
4. Verify MongoDB connection
5. Check JWT token validity

## Status: Ready to Test! 🚀

All components are installed and configured. Start the servers and begin testing!

---

**Note on Next.js Vulnerabilities**: The npm audit shows vulnerabilities in Next.js 14.2.3. Consider updating to the latest version in production:
```bash
npm install next@latest
```
