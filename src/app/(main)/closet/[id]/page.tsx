"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Pencil, Trash2, ImageIcon, WashingMachine } from "lucide-react";
import { parseSeasons } from "@/types";
import type { ClothingItem } from "@/types";
import { toast } from "sonner";
import { EditClothingModal } from "@/components/edit-clothing-modal";

export default function ClothingItemPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [item, setItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchItem = useCallback(async () => {
    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Item not found");
      router.push("/closet");
      return;
    }

    setItem(data as ClothingItem);
    setLoading(false);
  }, [id, supabase, router]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      if (item?.image_url) {
        const path = item.image_url.split("/clothing-images/")[1];
        if (path) {
          await supabase.storage.from("clothing-images").remove([path]);
        }
      }

      const { error } = await supabase.from("clothing_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item deleted");
      router.push("/closet");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !item) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const seasons = parseSeasons(item.season);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.push("/closet")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Closet
      </Button>

      <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square bg-muted max-h-[400px]">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-contain"
              sizes="600px"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
          {item.in_laundry && (
            <div className="absolute top-3 left-3 bg-gold text-white rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5">
              <WashingMachine className="h-3.5 w-3.5" />
              In Laundry
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-burgundy">{item.name}</h1>
            <p className="text-sm text-taupe mt-1">
              Added {new Date(item.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-burgundy/8 text-burgundy border-0 capitalize">{item.category}</Badge>
            {item.color && (
              <Badge variant="outline" className="capitalize">{item.color}</Badge>
            )}
            {item.brand && (
              <Badge variant="outline">{item.brand}</Badge>
            )}
            {seasons.map((s) => (
              <Badge key={s} variant="secondary" className="capitalize">{s}</Badge>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-burgundy hover:bg-burgundy-light gap-2 rounded-xl"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit Item
            </Button>
            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              className="gap-2"
              disabled={deleting}
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {confirmDelete ? "Confirm" : "Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditClothingModal
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => setItem(updated)}
      />
    </div>
  );
}
