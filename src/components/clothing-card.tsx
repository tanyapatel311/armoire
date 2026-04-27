"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, WashingMachine, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClothingItem } from "@/types";
import { parseSeasons } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { EditClothingModal } from "@/components/edit-clothing-modal";

interface ClothingCardProps {
  item: ClothingItem;
  onDelete?: (id: string) => void;
  onUpdated?: (item: ClothingItem) => void;
}

export function ClothingCard({ item, onDelete, onUpdated }: ClothingCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [laundry, setLaundry] = useState(item.in_laundry);
  const [currentItem, setCurrentItem] = useState(item);
  const supabase = createClient();
  const itemIsGuest = item.user_id === "guest";

  async function toggleLaundry(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (itemIsGuest) return;

    const newValue = !laundry;
    setLaundry(newValue);

    const { error } = await supabase
      .from("clothing_items")
      .update({ in_laundry: newValue })
      .eq("id", item.id);

    if (error) {
      setLaundry(!newValue);
      toast.error("Failed to update laundry status");
    } else {
      toast.success(newValue ? "Marked as in laundry" : "Marked as clean");
    }
  }

  const card = (
    <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="relative aspect-square bg-muted">
        {currentItem.image_url ? (
          <Image
            src={currentItem.image_url}
            alt={currentItem.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {!itemIsGuest && (
          <button
            onClick={toggleLaundry}
            className={`absolute top-2 left-2 rounded-full p-1.5 transition-all duration-200 ${
              laundry
                ? "bg-gold text-white hover:bg-gold-light shadow-md"
                : "bg-white/90 text-taupe hover:bg-white hover:text-gold shadow-sm"
            }`}
            title={laundry ? "Mark as clean" : "Mark as in laundry"}
          >
            <WashingMachine className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!itemIsGuest && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm text-taupe hover:text-brand transition-colors duration-200"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-red-50 flex items-center justify-center shadow-sm text-red-400 hover:text-red-600 transition-colors duration-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm text-burgundy truncate">{currentItem.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge className="text-xs capitalize bg-burgundy/8 text-burgundy border-0">
            {currentItem.category}
          </Badge>
          {currentItem.color && (
            <Badge className="text-xs capitalize bg-brand/8 text-brand border-0">
              {currentItem.color}
            </Badge>
          )}
          {parseSeasons(currentItem.season).map((s) => (
            <Badge key={s} className="text-xs capitalize bg-blush/60 text-burgundy/70 border-0">
              {s}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {itemIsGuest ? card : <Link href={`/closet/${item.id}`}>{card}</Link>}

      {!itemIsGuest && (
        <EditClothingModal
          item={currentItem}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(updated) => {
            setCurrentItem(updated);
            setLaundry(updated.in_laundry);
            onUpdated?.(updated);
          }}
        />
      )}
    </>
  );
}
