import Link from "next/link";
import Button from "@/components/ui/Button";
import ItemGrid from "@/components/ItemGrid";
import { Item } from "@/types";
import { Package, Users, Leaf, ArrowRight } from "lucide-react";

const featuredItems: Item[] = [
  {
    id: "1",
    name: "Power Drill Set",
    description: "Professional cordless drill with multiple bits",
    category: "Tools",
    condition: "like-new",
    pricePerDay: 15,
    deposit: 100,
    location: "Downtown",
    distance: 2.3,
    images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80"],
    owner: { id: "1", name: "John Doe", email: "john@example.com", rating: 4.8 },
    rating: 4.9,
    available: true,
  },
  {
    id: "2",
    name: "Canon DSLR Camera",
    description: "Professional camera with 18-55mm lens",
    category: "Electronics",
    condition: "good",
    pricePerDay: 35,
    deposit: 500,
    location: "Midtown",
    distance: 3.1,
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],
    owner: { id: "2", name: "Sarah Smith", email: "sarah@example.com", rating: 4.9 },
    rating: 4.7,
    available: true,
  },
  {
    id: "3",
    name: "Camping Tent (4-person)",
    description: "Waterproof tent perfect for weekend trips",
    category: "Sports Equipment",
    condition: "good",
    pricePerDay: 20,
    deposit: 250,
    location: "Westside",
    distance: 4.5,
    images: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80"],
    owner: { id: "3", name: "Mike Johnson", email: "mike@example.com", rating: 4.6 },
    rating: 4.8,
    available: true,
  },
  {
    id: "4",
    name: "Stand Mixer",
    description: "KitchenAid mixer with attachments",
    category: "Kitchen",
    condition: "like-new",
    pricePerDay: 12,
    deposit: 150,
    location: "Eastside",
    distance: 1.8,
    images: ["https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=800&q=80"],
    owner: { id: "4", name: "Emma Wilson", email: "emma@example.com", rating: 5.0 },
    rating: 5.0,
    available: true,
  },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-secondary to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text mb-6">
              Borrow What You Need,<br />Share What You Don't
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              Join your neighborhood sharing community. Save money, reduce waste, and connect with neighbors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse Items
                </Button>
              </Link>
              <Link href="/list-item">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  List an Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Three simple steps to start sharing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">1. Browse or List</h3>
              <p className="text-gray-600">
                Search for items you need or list items you want to share with your community
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">2. Connect</h3>
              <p className="text-gray-600">
                Message owners, agree on terms, and arrange pickup or delivery
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">3. Share & Save</h3>
              <p className="text-gray-600">
                Enjoy the item, save money, and help build a sustainable community
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Featured Items</h2>
            <p className="text-lg text-gray-600">Popular items in your neighborhood</p>
          </div>
          <ItemGrid items={featuredItems} />
          <div className="text-center mt-12">
            <Link href="/browse">
              <Button size="lg" variant="outline" className="group">
                View All Items
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Why LocalLoop?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-text mb-2">Save Money</h3>
              <p className="text-gray-600 text-sm">
                Borrow instead of buying items you only need occasionally
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-lg font-semibold text-text mb-2">Reduce Waste</h3>
              <p className="text-gray-600 text-sm">
                Promote sustainability by reusing items in your community
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-text mb-2">Build Community</h3>
              <p className="text-gray-600 text-sm">
                Connect with neighbors and strengthen local relationships
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-text mb-2">Quick & Easy</h3>
              <p className="text-gray-600 text-sm">
                Simple process to list, browse, and borrow items nearby
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-white/90">
            Join thousands of neighbors already sharing and saving
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
