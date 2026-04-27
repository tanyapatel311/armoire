"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useGuest } from "@/lib/guest-context";
import { SignUpModal } from "@/components/signup-modal";
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
import { OCCASIONS, SEASONS, STYLES, WEATHER_CONDITIONS } from "@/types";
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
  const {
    isGuest,
    guestItems,
    guestGenerationCount,
    addGuestOutfit,
    incrementGuestGeneration,
  } = useGuest();
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [weather, setWeather] = useState("");
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!isGuest) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          fetch("/api/generate/remaining")
            .then((r) => r.json())
            .then((d) => setRemaining(d.remaining ?? null))
            .catch(() => {});
        }
      });
    }
  }, [isGuest]);

  async function handleGenerate() {
    if (isGuest && guestGenerationCount >= 1) {
      setShowSignUp(true);
      return;
    }

    setGenerating(true);
    setOutfit(null);

    try {
      const payload: Record<string, unknown> = { occasion, season, weather, style, notes };
      if (isGuest) {
        payload.guestItems = guestItems;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.error || "Daily limit reached");
        setRemaining(0);
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Failed to generate outfit");
        return;
      }

      setOutfit(data);

      if (isGuest) {
        incrementGuestGeneration();
        addGuestOutfit(data);
      }

      if (data.remaining !== undefined) {
        setRemaining(data.remaining);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!outfit) return;

    if (isGuest) {
      setShowSignUp(true);
      return;
    }

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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SignUpModal open={showSignUp} onOpenChange={setShowSignUp} />

      <div className="animate-fade-in-up mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-editorial text-4xl flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-gold" />
              <span className="text-gradient">Outfit Generator</span>
            </h1>
            <p className="text-taupe mt-2">
              Let AI create the perfect outfit from your closet
            </p>
          </div>
          {!isGuest && remaining !== null && (
            <div className="text-right">
              <p className="text-sm font-medium text-burgundy">{remaining} of 5</p>
              <p className="text-xs text-taupe">generations left today</p>
            </div>
          )}
          {isGuest && (
            <div className="text-right">
              <p className="text-sm font-medium text-burgundy">
                {guestGenerationCount >= 1 ? "0" : "1"} of 1
              </p>
              <p className="text-xs text-taupe">free generation</p>
            </div>
          )}
        </div>
      </div>

      <div className="animate-fade-in-up grid gap-8 lg:grid-cols-5" style={{ animationDelay: "0.3s" }}>
        <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-burgundy">Preferences</CardTitle>
            <CardDescription className="text-taupe">Tell us about the occasion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-burgundy/80">Occasion</Label>
              <Select value={occasion} onValueChange={(v) => setOccasion(v ?? "")}>
                <SelectTrigger className="bg-ivory border-taupe/40">
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
              <Label className="text-sm font-medium text-burgundy/80">Season / Weather</Label>
              <Select value={season} onValueChange={(v) => setSeason(v ?? "")}>
                <SelectTrigger className="bg-ivory border-taupe/40">
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
              <Label className="text-sm font-medium text-burgundy/80">Weather</Label>
              <Select value={weather} onValueChange={(v) => setWeather(v ?? "")}>
                <SelectTrigger className="bg-ivory border-taupe/40">
                  <SelectValue placeholder="Current weather?" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_CONDITIONS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-burgundy/80">Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v ?? "")}>
                <SelectTrigger className="bg-ivory border-taupe/40">
                  <SelectValue placeholder="What's your vibe?" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-burgundy/80">Additional Notes</Label>
              <Textarea
                placeholder="e.g., I want something comfortable, prefer dark colors..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="bg-ivory border-taupe/40"
              />
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full bg-burgundy hover:bg-burgundy-light gap-2 rounded-xl text-base py-6 shadow-md hover:shadow-lg transition-all"
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {generating ? "Creating your look..." : "Generate Outfit"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {generating && (
            <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-brand mb-4" />
                <p className="text-lg font-heading text-burgundy">Styling your outfit...</p>
                <p className="text-sm text-taupe">
                  Our AI stylist is picking the perfect combination
                </p>
              </CardContent>
            </Card>
          )}

          {outfit && !generating && (
            <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm hover:border-brand/20 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-heading text-burgundy">{outfit.name}</CardTitle>
                    {outfit.occasion && (
                      <Badge variant="secondary" className="mt-2 bg-burgundy/8 text-burgundy border-0">
                        {outfit.occasion}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="gap-1 rounded-full"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1 bg-brand hover:bg-brand-light rounded-full"
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
                      <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
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
                        <p className="text-sm font-medium text-burgundy truncate">{item.name}</p>
                        <p className="text-xs text-taupe capitalize">
                          {item.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="font-heading text-burgundy font-semibold mb-2">Why this works</h3>
                  <p className="text-sm text-taupe">
                    {outfit.reasoning}
                  </p>
                </div>

                {outfit.styling_tips && (
                  <div>
                    <h3 className="font-heading text-burgundy font-semibold mb-2">Styling Tips</h3>
                    <p className="text-sm text-taupe">
                      {outfit.styling_tips}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!outfit && !generating && (
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0A4F47] via-[#0D6B63] to-[#064039] shadow-lg min-h-[360px] flex flex-col items-center justify-center text-center p-10">
              {/* Gold decorative curves */}
              <svg className="absolute bottom-0 left-0 w-full h-40 opacity-30" viewBox="0 0 400 160" preserveAspectRatio="none">
                <path d="M0,160 Q100,80 200,120 T400,60" fill="none" stroke="#C5973E" strokeWidth="1" />
                <path d="M0,140 Q120,60 240,100 T400,40" fill="none" stroke="#C5973E" strokeWidth="0.8" opacity="0.6" />
                <path d="M0,120 Q80,40 200,80 T400,20" fill="none" stroke="#C5973E" strokeWidth="0.5" opacity="0.4" />
              </svg>
              {/* Gold 4-pointed star/diamond */}
              <svg className="w-10 h-10 mb-5" viewBox="0 0 40 40">
                <polygon points="20,2 23,17 38,20 23,23 20,38 17,23 2,20 17,17" fill="#C5973E" opacity="0.9" />
                <polygon points="20,8 22,18 32,20 22,22 20,32 18,22 8,20 18,18" fill="#D4A843" />
                <circle cx="20" cy="20" r="2" fill="#F5E6C8" />
              </svg>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3 relative z-10">
                Ready to get styled?
              </h2>
              <p className="text-white/70 max-w-sm relative z-10">
                Select your preferences and let our AI
                <br />create the perfect outfit from your wardrobe
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
