"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Notification } from "@/types";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "borrow-request",
      title: "New Borrow Request",
      message: "John wants to borrow your drill",
      timestamp: new Date(),
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-secondary rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-text" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-text">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-secondary cursor-pointer transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <h4 className="font-medium text-sm text-text">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
