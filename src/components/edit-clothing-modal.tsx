"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  SEASONS,
  parseSeasons,
} from "@/types";
import type { ClothingItem, ClothingCategory, Season } from "@/types";

interface EditClothingModalProps {
  item: ClothingItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updatedItem: ClothingItem) => void;
}

export function EditClothingModal({
  item,
  open,
  onOpenChange,
  onSaved,
}: EditClothingModalProps) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ClothingCategory>(item.category);
  const [color, setColor] = useState(item.color ?? "");
  const [brand, setBrand] = useState(item.brand ?? "");
  const [seasons, setSeasons] = useState<Season[]>(parseSeasons(item.season));
  const [inLaundry, setInLaundry] = useState(item.in_laundry);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setColor(item.color ?? "");
    setBrand(item.brand ?? "");
    setSeasons(parseSeasons(item.season));
    setInLaundry(item.in_laundry);
  }, [item]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const seasonValue =
      seasons.length > 0 ? seasons.join(",") : "all";

    const { error } = await supabase
      .from("clothing_items")
      .update({
        name: name.trim(),
        category,
        color: color.trim() || null,
        brand: brand.trim() || null,
        season: seasonValue,
        in_laundry: inLaundry,
      })
      .eq("id", item.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update item");
      return;
    }

    const updatedItem: ClothingItem = {
      ...item,
      name: name.trim(),
      category,
      color: color.trim() || null,
      brand: brand.trim() || null,
      season: seasonValue,
      in_laundry: inLaundry,
    };

    toast.success("Item updated");
    onSaved(updatedItem);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details for this clothing item.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ClothingCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., Navy Blue"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Nike"
              />
            </div>
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label>Laundry Status</Label>
            <button
              type="button"
              onClick={() => setInLaundry((prev) => !prev)}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                inLaundry
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {inLaundry ? "In Laundry" : "Clean"}
            </button>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 w-full bg-burgundy hover:bg-burgundy-light text-white rounded-xl"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
