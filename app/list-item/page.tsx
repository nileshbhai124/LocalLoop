"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { Upload, X } from "lucide-react";

interface ListItemForm {
  name: string;
  description: string;
  category: string;
  condition: string;
  pricePerDay: number;
  location: string;
}

export default function ListItemPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListItemForm>();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListItemForm) => {
    if (images.length === 0) {
      addToast({
        title: "Images required",
        description: "Please upload at least one image",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      addToast({
        title: "Item listed!",
        description: "Your item is now available for borrowing",
        type: "success",
      });
      
      router.push("/dashboard");
    } catch (error) {
      addToast({
        title: "Failed to list item",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">List an Item</h1>
          <p className="text-gray-600">Share your items with the community</p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Item Name"
              type="text"
              placeholder="e.g., Power Drill, Camera, Tent"
              error={errors.name?.message}
              {...register("name", {
                required: "Item name is required",
                minLength: {
                  value: 3,
                  message: "Name must be at least 3 characters",
                },
              })}
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe your item, its features, and any important details..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                {...register("description", {
                  required: "Description is required",
                  minLength: {
                    value: 20,
                    message: "Description must be at least 20 characters",
                  },
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Category
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  {...register("category", { required: "Category is required" })}
                >
                  <option value="">Select a category</option>
                  <option value="Tools">Tools</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Books">Books</option>
                  <option value="Sports Equipment">Sports Equipment</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Garden">Garden</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Condition
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  {...register("condition", { required: "Condition is required" })}
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-500">{errors.condition.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Price per Day (₹)"
                type="number"
                step="1"
                placeholder="830"
                error={errors.pricePerDay?.message}
                {...register("pricePerDay", {
                  required: "Price is required",
                  min: {
                    value: 50,
                    message: "Price must be at least ₹50",
                  },
                })}
              />

              <Input
                label="Location"
                type="text"
                placeholder="e.g., Downtown, Midtown"
                error={errors.location?.message}
                {...register("location", {
                  required: "Location is required",
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-3">
                Upload Images
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Listing..." : "List Item"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
