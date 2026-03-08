'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Button from './ui/Button';
import Input from './ui/Input';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
  };
  message: string;
  timestamp: Date;
  readStatus: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  currentUserId: string;
  token: string;
}

export default function ChatWindow({
  conversationId,
  receiverId,
  receiverName,
  currentUserId,
  token
}: ChatWindowProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Authenticate
      newSocket.emit('authenticate', token);
    });

    newSocket.on('authenticated', (data: { userId: string }) => {
      console.log('Authenticated:', data.userId);
      
      // Join conversation room
      newSocket.emit('joinConversation', { conversationId });
      
      // Check online status
      newSocket.emit('getOnlineStatus', { userIds: [receiverId] });
      
      // Start heartbeat
      const heartbeatInterval = setInterval(() => {
        newSocket.emit('heartbeat');
      }, 30000);

      return () => clearInterval(heartbeatInterval);
    });

    newSocket.on('authError', (error: { message: string }) => {
      console.error('Auth error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, conversationId, receiverId]);

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receiveMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if conversation is open
      socket.emit('markAsRead', {
        senderId: message.sender._id,
        conversationId
      });
    });

    socket.on('messageSent', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('messageError', (error: { message: string }) => {
      console.error('Message error:', error);
      alert(error.message);
    });

    socket.on('pendingMessages', (pendingMessages: Message[]) => {
      setMessages(prev => [...prev, ...pendingMessages]);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageSent');
      socket.off('messageError');
      socket.off('pendingMessages');
    };
  }, [socket, conversationId]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket) return;

    socket.on('userTyping', (data: { userId: string; conversationId: string }) => {
      if (data.userId === receiverId) {
        setIsTyping(true);
      }
    });

    socket.on('userStoppedTyping', (data: { userId: string; conversationId: string }) => {
      if (data.userId === receiverId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [socket, receiverId]);

  // Listen for online status
  useEffect(() => {
    if (!socket) return;

    socket.on('onlineStatus', (status: Record<string, boolean>) => {
      setIsOnline(status[receiverId] || false);
    });

    socket.on('userOnline', (data: { userId: string }) => {
      if (data.userId === receiverId) {
        setIsOnline(true);
      }
    });

    socket.on('userOffline', (data: { userId: string }) => {
      if (data.userId === receiverId) {
        setIsOnline(false);
      }
    });

    return () => {
      socket.off('onlineStatus');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [socket, receiverId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socket || !newMessage.trim()) return;

    socket.emit('sendMessage', {
      receiver: receiverId,
      message: newMessage.trim(),
      conversationId
    });

    setNewMessage('');
    
    // Stop typing indicator
    socket.emit('stopTyping', {
      receiver: receiverId,
      conversationId
    });
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!socket) return;

    // Send typing indicator
    socket.emit('typing', {
      receiver: receiverId,
      conversationId
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        receiver: receiverId,
        conversationId
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-lg">{receiverName}</h3>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-gray-600">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="text-sm">
          {isConnected ? (
            <span className="text-green-600">Connected</span>
          ) : (
            <span className="text-red-600">Disconnected</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender._id === currentUserId;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwn
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!isConnected}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
