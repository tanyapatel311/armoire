"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useGuest } from "@/lib/guest-context";
import { ClothingCard } from "@/components/clothing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Shirt, Search, X, Palette, Info } from "lucide-react";
import type { ClothingItem } from "@/types";
import { CATEGORIES, COLORS } from "@/types";
import { toast } from "sonner";

export default function ClosetPage() {
  const { isGuest, guestItems, removeGuestItem, isLoading: guestLoading } = useGuest();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    if (isGuest) {
      setItems(guestItems);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load clothing items");
      return;
    }
    setItems(data || []);
    setLoading(false);
  }, [supabase, isGuest, guestItems]);

  useEffect(() => {
    if (!guestLoading) fetchItems();
  }, [fetchItems, guestLoading]);

  async function handleDelete(id: string) {
    if (isGuest) {
      removeGuestItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removed");
      return;
    }

    const item = items.find((i) => i.id === id);

    if (item?.image_url) {
      const path = item.image_url.split("/clothing-images/")[1];
      if (path) {
        await supabase.storage.from("clothing-images").remove([path]);
      }
    }

    const { error } = await supabase.from("clothing_items").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item deleted");
  }

  const filtered = useMemo(() => {
    let result = items;

    if (activeCategory !== "all") {
      result = result.filter((i) => i.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.brand?.toLowerCase().includes(q) ||
          i.color?.toLowerCase().includes(q)
      );
    }

    if (selectedColor) {
      const c = selectedColor.toLowerCase();
      result = result.filter((i) => i.color?.toLowerCase() === c);
    }

    return result;
  }, [items, activeCategory, searchQuery, selectedColor]);

  const hasActiveFilters = searchQuery.trim() || selectedColor;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-fade-in-up flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-editorial text-4xl text-gradient">My Closet</h1>
          <p className="text-taupe mt-2">
            {items.length} {items.length === 1 ? "item" : "items"} in your wardrobe
          </p>
        </div>
        <Link href="/closet/add">
          <Button className="bg-burgundy hover:bg-burgundy-light gap-2 rounded-full px-6 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      {isGuest && (
        <div className="animate-fade-in-up flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 mb-6" style={{ animationDelay: "0.2s" }}>
          <Info className="h-4 w-4 text-brand shrink-0" />
          <p className="text-sm text-brand">
            You&apos;re in guest mode &mdash; your items won&apos;t be saved.{" "}
            <Link href="/signup" className="underline underline-offset-2 font-medium hover:text-brand/80">
              Create an account
            </Link>{" "}
            to keep your closet.
          </p>
        </div>
      )}

      <div className="animate-fade-in-up bg-white rounded-2xl border border-[#E8DDD0] shadow-sm p-4 flex flex-col sm:flex-row gap-3 mb-6" style={{ animationDelay: "0.3s" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-taupe" />
          <Input
            placeholder="Search by name, brand, or color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-ivory border-taupe/40 focus:border-brand focus:ring-brand/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={selectedColor || "all"} onValueChange={(v) => setSelectedColor(v === "all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-[160px] bg-ivory border-taupe/40 focus:border-brand focus:ring-brand/10">
            <Palette className="h-4 w-4 mr-2 text-taupe" />
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {COLORS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="animate-fade-in-up flex flex-wrap gap-2 mb-6" style={{ animationDelay: "0.5s" }}>
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((cat) => {
          const isActive = activeCategory === cat.value;
          const count = cat.value === "all"
            ? items.length
            : items.filter((i) => i.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`pill ${isActive ? "pill-active" : "pill-inactive"}`}
            >
              {cat.label}
              <span className={`ml-1.5 text-xs ${isActive ? "text-white/70" : "text-taupe"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shirt className="h-16 w-16 text-taupe/40 mb-4" />
          <h2 className="heading-editorial text-xl mb-2">
            {hasActiveFilters
              ? "No items match your filters"
              : activeCategory === "all"
              ? "Your closet is empty"
              : `No ${activeCategory} yet`}
          </h2>
          <p className="text-taupe mb-6">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Start by adding your first clothing item"}
          </p>
          {!hasActiveFilters && (
            <Link href="/closet/add">
              <Button className="bg-burgundy hover:bg-burgundy-light gap-2 rounded-full px-6 shadow-sm">
                <Plus className="h-4 w-4" />
                Add Your First Item
              </Button>
            </Link>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedColor("");
                setActiveCategory("all");
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="animate-fade-in-up grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6" style={{ animationDelay: "0.7s" }}>
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
