"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ItemCard";
import { Package, MessageSquare, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Item } from "@/types";

const borrowedItems: Item[] = [
  {
    id: "1",
    name: "Power Drill Set",
    description: "Professional cordless drill",
    category: "Tools",
    condition: "like-new",
    pricePerDay: 15,
    deposit: 100,
    location: "Downtown",
    images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80"],
    owner: { id: "2", name: "Sarah Smith", email: "sarah@example.com" },
    available: false,
  },
];

const listedItems: Item[] = [
  {
    id: "2",
    name: "Canon DSLR Camera",
    description: "Professional camera with lens",
    category: "Electronics",
    condition: "good",
    pricePerDay: 35,
    deposit: 500,
    location: "Midtown",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],
    owner: { id: "1", name: "John Doe", email: "john@example.com" },
    available: true,
  },
];

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your items</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Items Listed</p>
                <p className="text-3xl font-bold text-text">3</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Currently Borrowed</p>
                <p className="text-3xl font-bold text-text">1</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-text">$245</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread Messages</p>
                <p className="text-3xl font-bold text-text">2</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/list-item" className="block">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">List New Item</h3>
                  <p className="text-sm text-gray-600">Share something with your community</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/browse" className="block">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">Browse Items</h3>
                  <p className="text-sm text-gray-600">Find what you need nearby</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/messages" className="block">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">Messages</h3>
                  <p className="text-sm text-gray-600">Chat with borrowers and owners</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text">Currently Borrowed</h2>
          </div>
          {borrowedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {borrowedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-600">You haven't borrowed any items yet</p>
              <Link href="/browse">
                <Button className="mt-4">Browse Items</Button>
              </Link>
            </Card>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text">Your Listed Items</h2>
            <Link href="/list-item">
              <Button size="sm">Add New</Button>
            </Link>
          </div>
          {listedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-600">You haven't listed any items yet</p>
              <Link href="/list-item">
                <Button className="mt-4">List Your First Item</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
