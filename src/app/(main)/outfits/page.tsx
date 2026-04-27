"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useGuest } from "@/lib/guest-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Layers, Sparkles, Plus, Pencil, Info } from "lucide-react";
import type { Outfit, ClothingItem } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { EditOutfitModal } from "@/components/edit-outfit-modal";

interface OutfitWithClothing extends Outfit {
  clothing_items: ClothingItem[];
}

export default function OutfitsPage() {
  const { isGuest, guestOutfits, guestItems, isLoading: guestLoading } = useGuest();
  const [outfits, setOutfits] = useState<OutfitWithClothing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const supabase = createClient();

  const fetchOutfits = useCallback(async () => {
    if (isGuest) {
      const enriched: OutfitWithClothing[] = guestOutfits.map((go) => {
        const itemsMap = new Map(guestItems.map((i) => [i.id, i]));
        return {
          id: crypto.randomUUID(),
          user_id: "guest",
          name: go.name,
          occasion: go.occasion || null,
          items: go.item_ids,
          ai_reasoning: go.reasoning,
          created_at: new Date().toISOString(),
          clothing_items: go.item_ids
            .map((id) => itemsMap.get(id))
            .filter(Boolean) as ClothingItem[],
        };
      });
      setOutfits(enriched);
      setLoading(false);
      return;
    }

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
  }, [supabase, isGuest, guestOutfits, guestItems]);

  useEffect(() => {
    if (!guestLoading) fetchOutfits();
  }, [fetchOutfits, guestLoading]);

  async function handleDelete(id: string) {
    if (isGuest) {
      setOutfits((prev) => prev.filter((o) => o.id !== id));
      toast.success("Outfit removed");
      return;
    }
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-fade-in-up flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-editorial text-4xl text-gradient">Saved Outfits</h1>
          <p className="text-taupe mt-2">
            {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"} saved
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/outfits/create">
            <Button variant="outline" className="btn-ghost-premium rounded-full px-6 gap-2">
              <Plus className="h-4 w-4" />
              Create Outfit
            </Button>
          </Link>
          <Link href="/generate">
            <Button className="bg-burgundy hover:bg-burgundy-light gap-2 rounded-full px-6 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Generate New
            </Button>
          </Link>
        </div>
      </div>

      {isGuest && (
        <div className="animate-fade-in-up flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 mb-6" style={{ animationDelay: "0.2s" }}>
          <Info className="h-4 w-4 text-brand shrink-0" />
          <p className="text-sm text-brand">
            You&apos;re in guest mode &mdash; outfits won&apos;t be saved.{" "}
            <Link href="/signup" className="underline underline-offset-2 font-medium hover:text-brand/80">
              Create an account
            </Link>{" "}
            to keep your outfits.
          </p>
        </div>
      )}

      {outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="h-16 w-16 text-taupe/40 mb-4" />
          <h2 className="heading-editorial text-xl mb-2">No outfits saved yet</h2>
          <p className="text-taupe mb-6">
            Create your own outfit or let AI generate one for you
          </p>
          <div className="flex gap-3">
            <Link href="/outfits/create">
              <Button variant="outline" className="btn-ghost-premium rounded-full px-6 gap-2">
                <Plus className="h-4 w-4" />
                Create Outfit
              </Button>
            </Link>
            <Link href="/generate">
              <Button className="bg-burgundy hover:bg-burgundy-light gap-2 rounded-full px-6 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero card for most recent outfit */}
          {outfits.length > 0 && (
            <Link href={`/outfits/${outfits[0].id}`} className="animate-fade-in-up block" style={{ animationDelay: "0.3s" }}>
              <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <span className="text-xs text-gold font-medium uppercase tracking-wider">Latest Look</span>
                    </div>
                    <h2 className="font-heading text-2xl text-burgundy mb-2">{outfits[0].name}</h2>
                    {outfits[0].occasion && (
                      <Badge className="w-fit mb-3 bg-burgundy/8 text-burgundy border-0">
                        {outfits[0].occasion}
                      </Badge>
                    )}
                    {outfits[0].ai_reasoning && (
                      <p className="text-sm text-[#8A7E74] line-clamp-3 mb-4">{outfits[0].ai_reasoning}</p>
                    )}
                    <p className="text-xs text-taupe">
                      {new Date(outfits[0].created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="md:w-1/2 p-4">
                    <div className="grid grid-cols-3 gap-2 h-full">
                      {outfits[0].clothing_items.slice(0, 6).map((item) => (
                        <div key={item.id} className="relative aspect-square bg-muted rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="200px" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-1 text-center">{item.name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* Remaining outfits grid */}
          {outfits.length > 1 && (
            <>
              <div className="gold-divider" />
              <div className="animate-fade-in-up grid gap-8 md:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "0.6s" }}>
                {outfits.slice(1).map((outfit) => (
                  <Link key={outfit.id} href={`/outfits/${outfit.id}`}>
                    <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer h-full group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-burgundy">{outfit.name}</CardTitle>
                            {outfit.occasion && (
                              <Badge className="mt-1 bg-burgundy/8 text-burgundy border-0">{outfit.occasion}</Badge>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-taupe hover:text-brand transition-colors"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOutfit(outfit); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 transition-colors"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(outfit.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {outfit.ai_reasoning && (
                          <CardDescription className="text-xs text-taupe mt-2 line-clamp-2">{outfit.ai_reasoning}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2">
                          {outfit.clothing_items.slice(0, 6).map((item) => (
                            <div key={item.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                              {item.image_url ? (
                                <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="120px" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-1 text-center">{item.name}</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-taupe mt-4">
                          {new Date(outfit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {editingOutfit && (
        <EditOutfitModal
          outfit={editingOutfit}
          open={!!editingOutfit}
          onOpenChange={(open) => {
            if (!open) setEditingOutfit(null);
          }}
          onSaved={(updated) => {
            setOutfits((prev) =>
              prev.map((o) =>
                o.id === updated.id
                  ? { ...o, ...updated }
                  : o
              )
            );
          }}
        />
      )}
    </div>
  );
}
