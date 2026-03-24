"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClothingCard } from "@/components/clothing-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Shirt } from "lucide-react";
import type { ClothingItem, ClothingCategory } from "@/types";
import { CATEGORIES } from "@/types";
import { toast } from "sonner";

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleDelete(id: string) {
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

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Closet</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "item" : "items"} in your wardrobe
          </p>
        </div>
        <Link href="/closet/add">
          <Button className="bg-rose-500 hover:bg-rose-600 gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
              <span className="ml-1 text-xs text-muted-foreground">
                ({items.filter((i) => i.category === cat.value).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shirt className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {activeCategory === "all" ? "Your closet is empty" : `No ${activeCategory} yet`}
          </h2>
          <p className="text-muted-foreground mb-6">
            Start by adding your first clothing item
          </p>
          <Link href="/closet/add">
            <Button className="bg-rose-500 hover:bg-rose-600 gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Item
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
