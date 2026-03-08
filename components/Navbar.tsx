"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Button from "./ui/Button";
import NotificationBell from "./NotificationBell";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-xl font-bold text-text">LocalLoop</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/browse" className="text-text hover:text-primary transition-colors">
              Browse Items
            </Link>
            <Link href="/#how-it-works" className="text-text hover:text-primary transition-colors">
              How It Works
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/list-item" className="text-text hover:text-primary transition-colors">
                  List an Item
                </Link>
                <NotificationBell />
                <Link href="/dashboard">
                  <UserAvatar user={user!} size="sm" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            <Link href="/browse" className="block py-2 text-text hover:text-primary transition-colors">
              Browse Items
            </Link>
            <Link href="/#how-it-works" className="block py-2 text-text hover:text-primary transition-colors">
              How It Works
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/list-item" className="block py-2 text-text hover:text-primary transition-colors">
                  List an Item
                </Link>
                <Link href="/dashboard" className="block py-2 text-text hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button variant="ghost" size="sm" className="w-full">Log In</Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button size="sm" className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
