import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  // Convert USD to INR (approximate rate: 1 USD = 83 INR)
  const priceInINR = price * 83;
  return `₹${priceInINR.toFixed(2)}`;
}

export function formatDistance(distance: number): string {
  return `${distance.toFixed(1)} km`;
}
