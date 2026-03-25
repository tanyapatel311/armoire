"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, Save, RefreshCw } from "lucide-react";
import { OCCASIONS, SEASONS } from "@/types";
import type { ClothingItem } from "@/types";
import { toast } from "sonner";

interface GeneratedOutfit {
  name: string;
  items: ClothingItem[];
  item_ids: string[];
  reasoning: string;
  styling_tips: string;
  occasion: string;
}

export default function GeneratePage() {
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setOutfit(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, season, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to generate outfit");
        return;
      }

      setOutfit(data);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!outfit) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("outfits").insert({
        user_id: userData.user.id,
        name: outfit.name,
        occasion: outfit.occasion,
        items: outfit.item_ids,
        ai_reasoning: outfit.reasoning,
      });

      if (error) throw error;
      toast.success("Outfit saved!");
    } catch {
      toast.error("Failed to save outfit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-brand" />
          Outfit Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Let AI create the perfect outfit from your closet
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 bg-white shadow-sm border-border">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Tell us about the occasion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select value={occasion} onValueChange={(v) => setOccasion(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="What's the occasion?" />
                </SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Season / Weather</Label>
              <Select value={season} onValueChange={(v) => setSeason(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Current season?" />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="e.g., I want something comfortable, prefer dark colors..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full bg-brand hover:bg-brand-light gap-2"
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Creating your look..." : "Generate Outfit"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {generating && (
            <Card className="bg-white shadow-sm border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-brand mb-4" />
                <p className="text-lg font-medium">Styling your outfit...</p>
                <p className="text-sm text-muted-foreground">
                  Our AI stylist is picking the perfect combination
                </p>
              </CardContent>
            </Card>
          )}

          {outfit && !generating && (
            <Card className="bg-white shadow-sm border-border hover:border-brand/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{outfit.name}</CardTitle>
                    {outfit.occasion && (
                      <Badge variant="secondary" className="mt-2">
                        {outfit.occasion}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="gap-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1 bg-brand hover:bg-brand-light"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {outfit.items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Why this works</h3>
                  <p className="text-sm text-muted-foreground">
                    {outfit.reasoning}
                  </p>
                </div>

                {outfit.styling_tips && (
                  <div>
                    <h3 className="font-semibold mb-2">Styling Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      {outfit.styling_tips}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!outfit && !generating && (
            <Card className="bg-white shadow-sm border-border">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Ready to get styled?
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  Select your preferences and let our AI create the perfect
                  outfit from your wardrobe
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
