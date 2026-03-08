"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserAvatar from "@/components/UserAvatar";
import ItemCard from "@/components/ItemCard";
import { Star, MapPin, Calendar, Edit } from "lucide-react";
import { User, Item } from "@/types";

const mockUser: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  bio: "Passionate about sharing and sustainability. Love helping neighbors and building community connections.",
  rating: 4.8,
  reviewCount: 24,
};

const userItems: Item[] = [
  {
    id: "1",
    name: "Power Drill Set",
    description: "Professional cordless drill",
    category: "Tools",
    condition: "like-new",
    pricePerDay: 15,
    location: "Downtown",
    images: ["/images/drill.jpg"],
    owner: mockUser,
    rating: 4.9,
    available: true,
  },
  {
    id: "2",
    name: "Canon DSLR Camera",
    description: "Professional camera with lens",
    category: "Electronics",
    condition: "good",
    pricePerDay: 35,
    location: "Midtown",
    images: ["/images/camera.jpg"],
    owner: mockUser,
    rating: 4.7,
    available: true,
  },
];

const reviews = [
  {
    id: "1",
    reviewer: "Sarah Smith",
    rating: 5,
    comment: "Great experience! The drill was in perfect condition and John was very helpful.",
    date: new Date("2024-02-15"),
  },
  {
    id: "2",
    reviewer: "Mike Johnson",
    rating: 4,
    comment: "Good communication and easy pickup. Would borrow again!",
    date: new Date("2024-02-10"),
  },
  {
    id: "3",
    reviewer: "Emma Wilson",
    rating: 5,
    comment: "Excellent! Very responsive and the item was exactly as described.",
    date: new Date("2024-02-05"),
  },
];

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <UserAvatar user={mockUser} size="lg" className="w-24 h-24 text-2xl" />
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-text mb-2">{mockUser.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Seattle, WA
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined Feb 2024
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{mockUser.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-600">({mockUser.reviewCount} reviews)</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <p className="text-gray-700 leading-relaxed">{mockUser.bio}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{userItems.length}</p>
              <p className="text-sm text-gray-600">Items Shared</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">12</p>
              <p className="text-sm text-gray-600">Times Borrowed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">$245</p>
              <p className="text-sm text-gray-600">Total Earned</p>
            </div>
          </div>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text mb-6">Listed Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-text mb-6">Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text">{review.reviewer}</h3>
                    <p className="text-sm text-gray-500">
                      {review.date.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
