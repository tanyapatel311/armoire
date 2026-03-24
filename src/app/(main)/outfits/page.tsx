"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Layers, Sparkles } from "lucide-react";
import type { Outfit, ClothingItem } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

interface OutfitWithClothing extends Outfit {
  clothing_items: ClothingItem[];
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<OutfitWithClothing[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOutfits = useCallback(async () => {
    const { data: outfitsData, error: outfitsError } = await supabase
      .from("outfits")
      .select("*")
      .order("created_at", { ascending: false });

    if (outfitsError) {
      toast.error("Failed to load outfits");
      setLoading(false);
      return;
    }

    if (!outfitsData || outfitsData.length === 0) {
      setOutfits([]);
      setLoading(false);
      return;
    }

    const allItemIds = outfitsData.flatMap((o) => o.items as string[]);
    const uniqueIds = [...new Set(allItemIds)];

    const { data: itemsData } = await supabase
      .from("clothing_items")
      .select("*")
      .in("id", uniqueIds);

    const itemsMap = new Map(
      (itemsData || []).map((item) => [item.id, item])
    );

    const enriched: OutfitWithClothing[] = outfitsData.map((outfit) => ({
      ...outfit,
      items: outfit.items as string[],
      clothing_items: (outfit.items as string[])
        .map((id) => itemsMap.get(id))
        .filter(Boolean) as ClothingItem[],
    }));

    setOutfits(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("outfits").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete outfit");
      return;
    }
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    toast.success("Outfit deleted");
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Saved Outfits</h1>
          <p className="text-muted-foreground mt-1">
            {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"} saved
          </p>
        </div>
        <Link href="/generate">
          <Button className="bg-rose-500 hover:bg-rose-600 gap-2">
            <Sparkles className="h-4 w-4" />
            Generate New
          </Button>
        </Link>
      </div>

      {outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No outfits saved yet</h2>
          <p className="text-muted-foreground mb-6">
            Generate your first AI-powered outfit
          </p>
          <Link href="/generate">
            <Button className="bg-rose-500 hover:bg-rose-600 gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Outfit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {outfits.map((outfit) => (
            <Card key={outfit.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{outfit.name}</CardTitle>
                    {outfit.occasion && (
                      <Badge variant="secondary" className="mt-1">
                        {outfit.occasion}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDelete(outfit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {outfit.ai_reasoning && (
                  <CardDescription className="text-xs mt-2 line-clamp-2">
                    {outfit.ai_reasoning}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {outfit.clothing_items.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square bg-muted rounded-md overflow-hidden"
                    >
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-1 text-center">
                          {item.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(outfit.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
