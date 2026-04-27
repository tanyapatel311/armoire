"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Outfit {
  id: string;
  user_id: string;
  name: string;
  occasion: string | null;
  items: string[];
  ai_reasoning: string | null;
  created_at: string;
}

interface EditOutfitModalProps {
  outfit: Outfit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updatedOutfit: Outfit) => void;
}

export function EditOutfitModal({
  outfit,
  open,
  onOpenChange,
  onSaved,
}: EditOutfitModalProps) {
  const [name, setName] = useState(outfit.name);
  const [occasion, setOccasion] = useState(outfit.occasion ?? "");
  const [notes, setNotes] = useState(outfit.ai_reasoning ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("outfits")
      .update({
        name: name.trim(),
        occasion: occasion.trim() || null,
        ai_reasoning: notes.trim() || null,
      })
      .eq("id", outfit.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error("Failed to update outfit");
      return;
    }

    toast.success("Outfit updated");
    onSaved(data as Outfit);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Outfit</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="outfit-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="outfit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Outfit name"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="outfit-occasion" className="text-sm font-medium">
              Occasion
            </label>
            <Input
              id="outfit-occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g. Casual, Work, Date Night"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="outfit-notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="outfit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this outfit..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-burgundy hover:bg-burgundy-light rounded-xl"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
