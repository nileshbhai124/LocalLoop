"use client";

import { Item } from "@/types";
import { MapPin, Star, Heart } from "lucide-react";
import { formatPrice, formatDistance } from "@/lib/utils";
import { getFirstImageUrl } from "@/lib/imageUtils";
import Card from "./ui/Card";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface ItemCardProps {
  item: Item;
  onWishlistToggle?: (itemId: string) => void;
  isWishlisted?: boolean;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Tools: "bg-blue-100 text-blue-700",
    Electronics: "bg-purple-100 text-purple-700",
    "Sports Equipment": "bg-orange-100 text-orange-700",
    Kitchen: "bg-pink-100 text-pink-700",
    "Home Decor": "bg-teal-100 text-teal-700",
    Accessories: "bg-rose-100 text-rose-700",
    Books: "bg-indigo-100 text-indigo-700",
    Garden: "bg-green-100 text-green-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
};

export default function ItemCard({ item, onWishlistToggle, isWishlisted = false }: ItemCardProps) {
  const imageUrl = getFirstImageUrl(item.images);
  const [wishlist, setWishlist] = useState(isWishlisted);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(!wishlist);
    onWishlistToggle?.(item.id);
  };

  return (
    <Link href={`/items/${item.id}`}>
      <Card className="group cursor-pointer h-full hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={item.name || 'Item image'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            priority={false}
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-item.jpg";
            }}
          />
          
          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            {item.available ? (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Available
              </span>
            ) : (
              <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Borrowed
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg hover:scale-110"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                wishlist ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-4">
          {/* Category Badge */}
          <div className="mb-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
          </div>

          {/* Title and Rating */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-text line-clamp-1 group-hover:text-primary transition-colors flex-1">
              {item.name}
            </h3>
            {item.rating && (
              <div className="flex items-center gap-1 text-sm ml-2 flex-shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{item.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          
          {/* Owner and Distance */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserAvatar user={item.owner} size="sm" />
              <span className="text-sm text-gray-700 font-medium">{item.owner.name}</span>
            </div>
            {item.distance && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{formatDistance(item.distance)}</span>
              </div>
            )}
          </div>
          
          {/* Price and Action */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(item.pricePerDay)}
              </p>
              <p className="text-xs text-gray-500">per day</p>
              {item.deposit && (
                <p className="text-xs text-gray-600 mt-1">
                  💰 Deposit: {formatPrice(item.deposit)}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
            >
              View Details
            </button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
