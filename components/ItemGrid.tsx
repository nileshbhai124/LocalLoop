import { Item } from "@/types";
import ItemCard from "./ItemCard";

interface ItemGridProps {
  items: Item[];
  loading?: boolean;
  onWishlistToggle?: (itemId: string) => void;
  wishlistedItems?: Set<string>;
}

export default function ItemGrid({ items, loading, onWishlistToggle, wishlistedItems = new Set() }: ItemGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-200 aspect-[4/3]" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-6xl">📦</span>
        </div>
        <h3 className="text-2xl font-bold text-text mb-3">No items found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We couldn't find any items matching your criteria. Try adjusting your filters or search query.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onWishlistToggle={onWishlistToggle}
          isWishlisted={wishlistedItems.has(item.id)}
        />
      ))}
    </div>
  );
}
