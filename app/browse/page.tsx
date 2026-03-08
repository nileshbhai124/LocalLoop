"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import ItemGrid from "@/components/ItemGrid";
import { Item } from "@/types";
import { ArrowUpDown } from "lucide-react";
import { mockItems } from "@/lib/mockData";

type SortOption = "distance" | "price-low" | "price-high" | "rating" | "newest";

export default function BrowsePage() {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set());

  const handleSearch = (query: string) => {
    setLoading(true);
    setTimeout(() => {
      const filtered = mockItems.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
      setItems(applySorting(filtered, sortBy));
      setLoading(false);
    }, 500);
  };

  const handleFilterChange = (filters: any) => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockItems];

      if (filters.category) {
        filtered = filtered.filter((item) => item.category === filters.category);
      }

      if (filters.minPrice) {
        filtered = filtered.filter((item) => item.pricePerDay >= parseFloat(filters.minPrice));
      }

      if (filters.maxPrice) {
        filtered = filtered.filter((item) => item.pricePerDay <= parseFloat(filters.maxPrice));
      }

      if (filters.distance) {
        filtered = filtered.filter((item) => (item.distance || 0) <= parseFloat(filters.distance));
      }

      if (filters.available) {
        filtered = filtered.filter((item) => item.available);
      }

      setItems(applySorting(filtered, sortBy));
      setLoading(false);
    }, 500);
  };

  const applySorting = (itemsToSort: Item[], sort: SortOption): Item[] => {
    const sorted = [...itemsToSort];
    
    switch (sort) {
      case "distance":
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case "price-low":
        return sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
      case "price-high":
        return sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "newest":
        return sorted.reverse();
      default:
        return sorted;
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setItems(applySorting(items, newSort));
  };

  const handleWishlistToggle = (itemId: string) => {
    setWishlistedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text mb-2">Browse Items</h1>
          <p className="text-gray-600">Discover items available in your neighborhood</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <FilterPanel onFilterChange={handleFilterChange} />
          </div>
        </div>

        {/* Results Header with Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-gray-700 font-medium">
              <span className="text-2xl font-bold text-text">{items.length}</span>{" "}
              {items.length === 1 ? "item" : "items"} available
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer font-medium text-sm"
            >
              <option value="distance">Nearest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Listings</option>
            </select>
          </div>
        </div>

        {/* Items Grid */}
        <ItemGrid
          items={items}
          loading={loading}
          onWishlistToggle={handleWishlistToggle}
          wishlistedItems={wishlistedItems}
        />
      </div>
    </div>
  );
}
