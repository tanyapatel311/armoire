"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil, Trash2, Calendar } from "lucide-react";
import type { Outfit, ClothingItem } from "@/types";
import { toast } from "sonner";
import { EditOutfitModal } from "@/components/edit-outfit-modal";

export default function OutfitDetailPage() {
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const outfitId = params.id as string;

  const fetchOutfit = useCallback(async () => {
    const { data, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("id", outfitId)
      .single();

    if (error || !data) {
      toast.error("Outfit not found");
      router.push("/outfits");
      return;
    }

    setOutfit(data);

    const itemIds = data.items as string[];
    if (itemIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("clothing_items")
        .select("*")
        .in("id", itemIds);

      if (itemsError) {
        toast.error("Failed to load outfit items");
      } else {
        const itemsMap = new Map(
          (itemsData || []).map((item) => [item.id, item])
        );
        const ordered = itemIds
          .map((id) => itemsMap.get(id))
          .filter(Boolean) as ClothingItem[];
        setClothingItems(ordered);
      }
    }

    setLoading(false);
  }, [supabase, outfitId, router]);

  useEffect(() => {
    fetchOutfit();
  }, [fetchOutfit]);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    const { error } = await supabase
      .from("outfits")
      .delete()
      .eq("id", outfitId);

    if (error) {
      toast.error("Failed to delete outfit");
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }

    toast.success("Outfit deleted");
    router.push("/outfits");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!outfit) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.push("/outfits")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Outfits
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="heading-editorial text-3xl">
                {outfit.name}
              </h1>
              {outfit.occasion && (
                <Badge variant="secondary">{outfit.occasion}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-taupe">
              <Calendar className="h-4 w-4" />
              Created{" "}
              {new Date(outfit.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {outfit.ai_reasoning && (
            <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-taupe">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{outfit.ai_reasoning}</p>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="font-heading text-lg font-semibold mb-4 text-burgundy">
              Items ({clothingItems.length})
            </h2>
            {clothingItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No items found for this outfit.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {clothingItems.map((item) => (
                  <Link key={item.id} href={`/closet/${item.id}`}>
                    <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
                      <div className="relative aspect-square bg-muted">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-2 text-center">
                            {item.name}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-burgundy hover:bg-burgundy-light gap-2 rounded-xl"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit Outfit
          </Button>
          <Button
            variant={confirmDelete ? "destructive" : "outline"}
            className="w-full gap-2"
            onClick={handleDelete}
            disabled={deleting}
            onBlur={() => setConfirmDelete(false)}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {confirmDelete
              ? "Click again to confirm"
              : deleting
                ? "Deleting..."
                : "Delete Outfit"}
          </Button>
        </div>
      </div>

      <EditOutfitModal
        outfit={outfit}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => setOutfit(updated)}
      />
    </div>
  );
}
