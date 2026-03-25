"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, ArrowLeft, ImageIcon, Wand2, Check } from "lucide-react";
import { CATEGORIES, SEASONS } from "@/types";
import type { ClothingCategory, Season } from "@/types";
import { toast } from "sonner";

async function removeBackground(file: File): Promise<Blob> {
  const { removeBackground: removeBg } = await import(
    "@imgly/background-removal"
  );

  const blob = await removeBg(file, {
    output: { format: "image/png", quality: 0.9 },
  });

  return addWhiteBackground(blob);
}

function addWhiteBackground(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Failed to create image"));
        },
        "image/png",
        0.9
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(blob);
  });
}

export default function AddClothingPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClothingCategory | "">("");
  const [color, setColor] = useState("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [brand, setBrand] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setImageFile(file);
    setProcessedBlob(null);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setProcessing(true);
    toast.info("Removing background... This may take a few seconds on first use.");

    try {
      const result = await removeBackground(file);
      setProcessedBlob(result);

      const processedUrl = URL.createObjectURL(result);
      setImagePreview(processedUrl);
      toast.success("Background removed!");
    } catch (err) {
      console.error("Background removal failed:", err);
      toast.error("Background removal failed — using original image.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (processing) {
      toast.error("Please wait for image processing to finish");
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      let imageUrl: string | null = null;
      const uploadData = processedBlob || imageFile;

      if (uploadData) {
        const fileName = `${userId}/${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("clothing-images")
          .upload(fileName, uploadData, {
            contentType: "image/png",
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("clothing-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("clothing_items").insert({
        user_id: userId,
        name,
        category,
        color: color || null,
        season: seasons.length > 0 ? seasons.join(",") : "all",
        brand: brand || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success("Item added to your closet!");
      router.push("/closet");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to add item. Please try again.";
      toast.error(message);
      console.error("Add item error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Closet
      </Button>

      <Card className="bg-white shadow-sm border-border hover:border-brand/30 transition-colors">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-brand/40 transition-colors"
              onClick={() => !processing && fileInputRef.current?.click()}
            >
              {processing ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <Wand2 className="h-10 w-10 text-brand animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-brand">
                    Removing background...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    First time may take 10-15s while the AI model loads
                  </p>
                </div>
              ) : imagePreview ? (
                <div className="space-y-3">
                  <div className="relative mx-auto w-48 h-48">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                  {processedBlob && (
                    <p className="text-xs text-brand font-medium">
                      Background removed — click to change photo
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                  <p className="text-sm font-medium">
                    Click to upload a photo
                  </p>
                  <p className="text-xs">
                    PNG, JPG up to 10MB — background will be auto-removed
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Blue Denim Jacket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ClothingCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Seasons</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SEASONS.map((s) => {
                    const isSelected = seasons.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          setSeasons((prev) =>
                            isSelected
                              ? prev.filter((v) => v !== s.value)
                              : [...prev, s.value]
                          )
                        }
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? "border-brand bg-mint text-brand"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                            isSelected
                              ? "border-brand bg-brand text-white"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Navy Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Levi's"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-light gap-2"
              disabled={loading || processing}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {loading ? "Adding..." : "Add to Closet"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
