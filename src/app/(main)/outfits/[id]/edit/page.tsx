"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Save,
  Check,
  Shirt,
} from "lucide-react";
import { CATEGORIES } from "@/types";
import type { ClothingItem, Outfit } from "@/types";
import { toast } from "sonner";

export default function EditOutfitPage() {
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const outfitId = params.id as string;

  const fetchData = useCallback(async () => {
    const [outfitResult, itemsResult] = await Promise.all([
      supabase.from("outfits").select("*").eq("id", outfitId).single(),
      supabase
        .from("clothing_items")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (outfitResult.error || !outfitResult.data) {
      toast.error("Outfit not found");
      router.push("/outfits");
      return;
    }

    if (itemsResult.error) {
      toast.error("Failed to load closet");
      return;
    }

    const outfit = outfitResult.data as Outfit;
    setName(outfit.name);
    setOccasion(outfit.occasion || "");
    setNotes(outfit.ai_reasoning || "");
    setSelectedIds(new Set(outfit.items));
    setItems(itemsResult.data || []);
    setLoading(false);
  }, [supabase, outfitId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Please give your outfit a name");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Select at least one item");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("outfits")
        .update({
          name: name.trim(),
          occasion: occasion || null,
          items: Array.from(selectedIds),
          ai_reasoning: notes || null,
        })
        .eq("id", outfitId);

      if (error) throw error;

      toast.success("Outfit updated!");
      router.push(`/outfits/${outfitId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update outfit";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.push(`/outfits/${outfitId}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Outfit
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="heading-editorial text-3xl">Edit Outfit</h1>
            <p className="text-taupe mt-2">
              Update items and details for this outfit
            </p>
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all">All</TabsTrigger>
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shirt className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {activeCategory === "all"
                  ? "Your closet is empty"
                  : `No ${activeCategory} in your closet`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-brand ring-2 ring-mint"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="relative aspect-square bg-muted">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-1 text-center">
                          {item.name}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 h-6 w-6 rounded-full bg-brand flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-xs font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-20 bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-burgundy">Outfit Details</CardTitle>
              <CardDescription>
                {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"}{" "}
                selected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square bg-muted rounded-md overflow-hidden cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-1 text-center">
                          {item.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="outfit-name">Outfit Name *</Label>
                <Input
                  id="outfit-name"
                  placeholder="e.g., Casual Friday Look"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  placeholder="e.g., Work, Date Night"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about this outfit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/outfits/${outfitId}`)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || selectedIds.size === 0}
                  className="flex-1 bg-burgundy hover:bg-burgundy-light gap-2 rounded-xl"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
