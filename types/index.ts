export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
}

export interface ItemImage {
  url: string;
  publicId: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: "new" | "like-new" | "good" | "fair";
  pricePerDay: number;
  deposit?: number;  // Security deposit amount (refundable)
  location: string;
  distance?: number;
  images: (string | ItemImage)[];  // Support both string URLs and image objects
  owner: User;
  rating?: number;
  available: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: "borrow-request" | "message" | "approval";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface BorrowRequest {
  id: string;
  item: Item;
  borrower: User;
  startDate: Date;
  endDate: Date;
  status: "pending" | "approved" | "rejected";
}
