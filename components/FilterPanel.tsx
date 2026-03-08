"use client";

import { useState } from "react";
import Button from "./ui/Button";
import { SlidersHorizontal } from "lucide-react";

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    distance: "",
    available: true,
  });

  const categories = [
    "All Categories",
    "Tools",
    "Electronics",
    "Kitchen",
    "Home Decor",
    "Accessories",
    "Sports Equipment",
    "Books",
    "Garden",
    "Other",
  ];

  const handleApply = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 p-6 z-10 animate-fade-in">
          <h3 className="font-semibold text-lg mb-4">Filters</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === "All Categories" ? "" : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Price Range (per day)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Distance (km)
              </label>
              <input
                type="number"
                placeholder="Max distance"
                value={filters.distance}
                onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={filters.available}
                onChange={(e) => setFilters({ ...filters, available: e.target.checked })}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="available" className="text-sm text-text">
                Available only
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
