import { ItemImage } from "@/types";

/**
 * Get the URL from an image that can be either a string or an object
 * @param image - Image data (string URL or object with url property)
 * @param fallback - Fallback image URL
 * @returns Image URL string
 */
export function getImageUrl(
  image: string | ItemImage | undefined | null,
  fallback: string = "/placeholder-item.jpg"
): string {
  if (!image) {
    return fallback;
  }

  // Handle if image is an object with url property
  if (typeof image === "object" && image !== null && "url" in image) {
    return image.url || fallback;
  }

  // Handle if image is a string
  if (typeof image === "string") {
    return image;
  }

  return fallback;
}

/**
 * Get the first image URL from an array of images
 * @param images - Array of images (strings or objects)
 * @param fallback - Fallback image URL
 * @returns First image URL or fallback
 */
export function getFirstImageUrl(
  images: (string | ItemImage)[] | undefined | null,
  fallback: string = "/placeholder-item.jpg"
): string {
  if (!images || images.length === 0) {
    return fallback;
  }

  return getImageUrl(images[0], fallback);
}

/**
 * Get all image URLs from an array of images
 * @param images - Array of images (strings or objects)
 * @returns Array of image URL strings
 */
export function getAllImageUrls(
  images: (string | ItemImage)[] | undefined | null
): string[] {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map((image) => getImageUrl(image, "")).filter((url) => url !== "");
}

/**
 * Check if an image URL is from Cloudinary
 * @param url - Image URL
 * @returns True if URL is from Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com") || url.includes("res.cloudinary");
}

/**
 * Validate image URL
 * @param url - Image URL to validate
 * @returns True if URL is valid
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    // Check if it's a relative path
    return url.startsWith("/");
  }
}
