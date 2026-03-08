"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import UserAvatar from "@/components/UserAvatar";
import ChatWindow from "@/components/ChatWindow";
import { Conversation, Message, User } from "@/types";
import { MessageSquare } from "lucide-react";

const mockConversations: Conversation[] = [
  {
    id: "1",
    participant: {
      id: "2",
      name: "Sarah Smith",
      email: "sarah@example.com",
      rating: 4.9,
    },
    lastMessage: {
      id: "1",
      senderId: "2",
      receiverId: "1",
      content: "Is the drill still available?",
      timestamp: new Date(),
      read: false,
    },
    unreadCount: 1,
  },
  {
    id: "2",
    participant: {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      rating: 4.6,
    },
    lastMessage: {
      id: "2",
      senderId: "1",
      receiverId: "3",
      content: "Thanks for lending the tent!",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    },
    unreadCount: 0,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "2",
    receiverId: "1",
    content: "Hi! I'm interested in borrowing your power drill.",
    timestamp: new Date(Date.now() - 7200000),
    read: true,
  },
  {
    id: "2",
    senderId: "current-user",
    receiverId: "2",
    content: "Sure! When do you need it?",
    timestamp: new Date(Date.now() - 7000000),
    read: true,
  },
  {
    id: "3",
    senderId: "2",
    receiverId: "1",
    content: "Is the drill still available?",
    timestamp: new Date(),
    read: false,
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    mockConversations[0]
  );
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "current-user",
      receiverId: selectedConversation?.participant.id || "",
      content,
      timestamp: new Date(),
      read: false,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text mb-6">Messages</h1>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            <div className="border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-text">Conversations</h2>
              </div>
              
              {mockConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                </div>
              ) : (
                <div>
                  {mockConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-secondary transition-colors ${
                        selectedConversation?.id === conversation.id ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar user={conversation.participant} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-text truncate">
                              {conversation.participant.name}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              {selectedConversation ? (
                <ChatWindow
                  participant={selectedConversation.participant}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
