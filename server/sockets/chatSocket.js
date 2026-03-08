const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const { verifyToken } = require('../utils/jwt');

/**
 * Real-time chat socket handler with advanced features
 * @param {SocketIO.Server} io - Socket.io server instance
 */
const chatSocket = (io) => {
  // Store active users: userId -> { socketId, status, lastActivity }
  const activeUsers = new Map();
  
  // Rate limiting map: userId -> { count, resetTime }
  const rateLimits = new Map();
  
  // Typing indicators: conversationId -> Set of userIds
  const typingUsers = new Map();

  /**
   * Rate limiter for messages
   */
  const checkRateLimit = (userId) => {
    const now = Date.now();
    const limit = rateLimits.get(userId);
    
    if (!limit || now > limit.resetTime) {
      rateLimits.set(userId, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      });
      return true;
    }
    
    if (limit.count >= 10) { // Max 10 messages per minute
      return false;
    }
    
    limit.count++;
    return true;
  };

  /**
   * Sanitize message text
   */
  const sanitizeMessage = (text) => {
    if (!text) return '';
    return text
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .substring(0, 1000); // Max 1000 characters
  };

  /**
   * Get or create conversation
   */
  const getOrCreateConversation = async (user1Id, user2Id, itemId = null) => {
    let conversation = await Conversation.findOne({
      participants: { $all: [user1Id, user2Id] },
      ...(itemId && { itemId })
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [user1Id, user2Id],
        itemId,
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        }
      });
    }

    return conversation;
  };

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Authenticate user
    socket.on('authenticate', async (token) => {
      try {
        const decoded = verifyToken(token);
        socket.userId = decoded.id;
        
        // Store active user
        activeUsers.set(decoded.id, {
          socketId: socket.id,
          status: 'online',
          lastActivity: Date.now()
        });
        
        socket.emit('authenticated', { userId: decoded.id });
        
        // Notify others that user is online
        socket.broadcast.emit('userOnline', { userId: decoded.id });
        
        // Send pending offline messages
        const pendingMessages = await Message.find({
          receiver: decoded.id,
          deliveredAt: null
        }).limit(50);
        
        if (pendingMessages.length > 0) {
          socket.emit('pendingMessages', pendingMessages);
          
          // Mark as delivered
          await Message.updateMany(
            { _id: { $in: pendingMessages.map(m => m._id) } },
            { deliveredAt: new Date() }
          );
        }
        
        console.log(`User authenticated: ${decoded.id}`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authError', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      try {
        if (!socket.userId) {
          return socket.emit('messageError', { message: 'Not authenticated' });
        }

        const { receiver, message, itemId } = data;

        // Rate limiting
        if (!checkRateLimit(socket.userId)) {
          return socket.emit('messageError', { 
            message: 'Rate limit exceeded. Please slow down.' 
          });
        }

        // Validate input
        if (!receiver || !message) {
          return socket.emit('messageError', { 
            message: 'Receiver and message are required' 
          });
        }

        // Sanitize message
        const sanitizedMessage = sanitizeMessage(message);
        if (!sanitizedMessage) {
          return socket.emit('messageError', { 
            message: 'Invalid message content' 
          });
        }

        // Get or create conversation
        const conversation = await getOrCreateConversation(
          socket.userId,
          receiver,
          itemId
        );

        // Save message to database
        const newMessage = await Message.create({
          sender: socket.userId,
          receiver,
          conversation: conversation._id,
          itemId,
          message: sanitizedMessage,
          timestamp: new Date()
        });

        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'name avatar')
          .populate('receiver', 'name avatar');

        // Update conversation
        conversation.lastMessage = {
          text: sanitizedMessage,
          sender: socket.userId,
          timestamp: new Date()
        };
        conversation.unreadCount[receiver] = (conversation.unreadCount[receiver] || 0) + 1;
        await conversation.save();

        // Send to receiver if online
        const receiverData = activeUsers.get(receiver);
        if (receiverData) {
          io.to(receiverData.socketId).emit('receiveMessage', populatedMessage);
          
          // Mark as delivered
          newMessage.deliveredAt = new Date();
          await newMessage.save();
        } else {
          // Create notification for offline user
          await Notification.create({
            user: receiver,
            type: 'new_message',
            title: 'New Message',
            message: `You have a new message from ${socket.userId}`,
            relatedUser: socket.userId
          });
        }

        // Send confirmation to sender
        socket.emit('messageSent', populatedMessage);

        // Emit conversation update
        [socket.userId, receiver].forEach(userId => {
          const userData = activeUsers.get(userId);
          if (userData) {
            io.to(userData.socketId).emit('conversationUpdated', {
              conversationId: conversation._id,
              lastMessage: conversation.lastMessage
            });
          }
        });

        console.log(`Message sent: ${socket.userId} → ${receiver}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { 
          message: 'Failed to send message',
          error: error.message 
        });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      if (!socket.userId) return;
      
      const { receiver, conversationId } = data;
      const receiverData = activeUsers.get(receiver);
      
      if (receiverData) {
        io.to(receiverData.socketId).emit('userTyping', { 
          userId: socket.userId,
          conversationId 
        });
      }
      
      // Add to typing users
      if (conversationId) {
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, new Set());
        }
        typingUsers.get(conversationId).add(socket.userId);
      }
    });

    // Stop typing
    socket.on('stopTyping', (data) => {
      if (!socket.userId) return;
      
      const { receiver, conversationId } = data;
      const receiverData = activeUsers.get(receiver);
      
      if (receiverData) {
        io.to(receiverData.socketId).emit('userStoppedTyping', { 
          userId: socket.userId,
          conversationId 
        });
      }
      
      // Remove from typing users
      if (conversationId && typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(socket.userId);
      }
    });

    // Mark messages as read
    socket.on('markAsRead', async (data) => {
      try {
        if (!socket.userId) return;
        
        const { senderId, conversationId } = data;
        
        // Update messages
        const result = await Message.updateMany(
          { 
            sender: senderId, 
            receiver: socket.userId, 
            readStatus: false,
            ...(conversationId && { conversation: conversationId })
          },
          { 
            readStatus: true, 
            readAt: new Date() 
          }
        );

        // Update conversation unread count
        if (conversationId) {
          await Conversation.findByIdAndUpdate(conversationId, {
            [`unreadCount.${socket.userId}`]: 0
          });
        }

        // Notify sender
        const senderData = activeUsers.get(senderId);
        if (senderData) {
          io.to(senderData.socketId).emit('messagesRead', { 
            userId: socket.userId,
            conversationId,
            count: result.modifiedCount
          });
        }

        console.log(`Messages marked as read: ${senderId} → ${socket.userId}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Join conversation room
    socket.on('joinConversation', async (data) => {
      if (!socket.userId) return;
      
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);
      
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leaveConversation', (data) => {
      if (!socket.userId) return;
      
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Get online status
    socket.on('getOnlineStatus', (data) => {
      const { userIds } = data;
      const onlineStatus = {};
      
      userIds.forEach(userId => {
        onlineStatus[userId] = activeUsers.has(userId);
      });
      
      socket.emit('onlineStatus', onlineStatus);
    });

    // Heartbeat to update last activity
    socket.on('heartbeat', () => {
      if (socket.userId && activeUsers.has(socket.userId)) {
        const userData = activeUsers.get(socket.userId);
        userData.lastActivity = Date.now();
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        rateLimits.delete(socket.userId);
        
        // Remove from all typing indicators
        typingUsers.forEach((users, conversationId) => {
          users.delete(socket.userId);
        });
        
        // Notify others that user is offline
        socket.broadcast.emit('userOffline', { userId: socket.userId });
        
        console.log(`User ${socket.userId} went offline`);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Cleanup inactive users every 5 minutes
  setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    activeUsers.forEach((userData, userId) => {
      if (now - userData.lastActivity > timeout) {
        activeUsers.delete(userId);
        io.emit('userOffline', { userId });
        console.log(`Removed inactive user: ${userId}`);
      }
    });
  }, 5 * 60 * 1000);

  return io;
};

module.exports = chatSocket;
