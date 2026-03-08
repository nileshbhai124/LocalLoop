"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import UserAvatar from "@/components/UserAvatar";
import { MapPin, Star, MessageSquare, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUtils";
import { Item } from "@/types";

const mockItem: Item = {
  id: "1",
  name: "Power Drill Set",
  description: "Professional cordless drill with multiple bits and carrying case. Perfect for home improvement projects. Includes 20V battery and charger. The drill has variable speed control and LED work light. Great condition, well-maintained.",
  category: "Tools",
  condition: "like-new",
  pricePerDay: 15,
  deposit: 100,
  location: "Downtown, Seattle",
  distance: 2.3,
  images: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
  ],
  owner: {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    rating: 4.8,
    reviewCount: 24,
  },
  rating: 4.9,
  available: true,
};

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % mockItem.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + mockItem.images.length) % mockItem.images.length);
  };

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days * mockItem.pricePerDay : 0;
  };

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-6">
              <div className="relative aspect-[16/10] bg-gray-100">
                <Image
                  src={getImageUrl(mockItem.images[currentImageIndex])}
                  alt={mockItem.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-item.jpg";
                  }}
                />
                
                {mockItem.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {mockItem.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white w-6"
                          : "bg-white/50"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-text mb-2">
                      {mockItem.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {mockItem.location}
                      </span>
                      <span className="px-2 py-1 bg-secondary rounded-full">
                        {mockItem.category}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {mockItem.condition}
                      </span>
                    </div>
                  </div>
                  {mockItem.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-lg">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{mockItem.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-text mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{mockItem.description}</p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-semibold text-text mb-4">Owner</h2>
                  <div className="flex items-center gap-4">
                    <UserAvatar user={mockItem.owner} size="lg" />
                    <div>
                      <h3 className="font-semibold text-text">{mockItem.owner.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {mockItem.owner.rating?.toFixed(1)} ({mockItem.owner.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(mockItem.pricePerDay)}
                  <span className="text-base font-normal text-gray-600">/day</span>
                </p>
                {mockItem.deposit && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Security Deposit:</span> {formatPrice(mockItem.deposit)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      ✓ Fully refundable if returned undamaged
                    </p>
                  </div>
                )}
              </div>

              {mockItem.available ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>

                  {startDate && endDate && calculateTotal() > 0 && (
                    <div className="mb-6 p-4 bg-secondary rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          {formatPrice(mockItem.pricePerDay)} × {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                        <span className="font-semibold">{formatPrice(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(calculateTotal())}</span>
                      </div>
                    </div>
                  )}

                  <Button className="w-full mb-3" size="lg">
                    Request to Borrow
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Message Owner
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">This item is currently unavailable</p>
                  <Button variant="outline" className="w-full">
                    Notify When Available
                  </Button>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-text mb-3">Safety Tips</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Meet in a public place</li>
                  <li>• Inspect the item before borrowing</li>
                  <li>• Agree on terms in writing</li>
                  <li>• Report any issues immediately</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
