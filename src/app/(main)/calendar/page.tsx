"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarDays, Save, Trash2, Flame } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Outfit, OutfitLog, ClothingItem } from "@/types";
import { toast } from "sonner";

function dateToString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateFromString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [logs, setLogs] = useState<OutfitLog[]>([]);
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const loggedDates = useMemo(
    () => logs.map((l) => dateFromString(l.date_worn)),
    [logs]
  );

  const fetchData = useCallback(async () => {
    const [outfitsRes, logsRes, itemsRes] = await Promise.all([
      supabase.from("outfits").select("*").order("created_at", { ascending: false }),
      supabase.from("outfit_log").select("*").order("date_worn", { ascending: false }),
      supabase.from("clothing_items").select("*"),
    ]);

    if (outfitsRes.data) setOutfits(outfitsRes.data.map(o => ({ ...o, items: o.items as string[] })));
    if (logsRes.data) setLogs(logsRes.data);
    if (itemsRes.data) setAllItems(itemsRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dateStr = date ? dateToString(date) : "";

  const selectedDateLog = useMemo(
    () => logs.find((l) => l.date_worn === dateStr) || null,
    [logs, dateStr]
  );

  const loggedOutfit = useMemo(() => {
    if (!selectedDateLog?.outfit_id) return null;
    return outfits.find((o) => o.id === selectedDateLog.outfit_id) || null;
  }, [selectedDateLog, outfits]);

  const loggedOutfitItems = useMemo(() => {
    if (!loggedOutfit) return [];
    return loggedOutfit.items
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean) as ClothingItem[];
  }, [loggedOutfit, allItems]);

  useEffect(() => {
    if (selectedDateLog) {
      setSelectedOutfit(selectedDateLog.outfit_id || "");
      setNotes(selectedDateLog.notes || "");
    } else {
      setSelectedOutfit("");
      setNotes("");
    }
  }, [selectedDateLog]);

  async function handleSaveLog() {
    if (!date || !selectedOutfit) {
      toast.error("Please select a date and outfit");
      return;
    }

    setSaving(true);

    if (selectedDateLog) {
      const { error } = await supabase
        .from("outfit_log")
        .update({
          outfit_id: selectedOutfit,
          notes: notes || null,
        })
        .eq("id", selectedDateLog.id);

      if (error) {
        toast.error("Failed to update log");
        setSaving(false);
        return;
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase.from("outfit_log").insert({
        user_id: userData.user.id,
        outfit_id: selectedOutfit,
        date_worn: dateStr,
        notes: notes || null,
      });

      if (error) {
        toast.error("Failed to save log");
        setSaving(false);
        return;
      }
    }

    toast.success("Outfit logged!");
    setSaving(false);
    fetchData();
  }

  async function handleDeleteLog() {
    if (!selectedDateLog) return;

    const { error } = await supabase
      .from("outfit_log")
      .delete()
      .eq("id", selectedDateLog.id);

    if (error) {
      toast.error("Failed to delete log");
      return;
    }

    toast.success("Log removed");
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const logsThisMonth = logs.filter((l) => {
    const d = dateFromString(l.date_worn);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="animate-fade-in-up mb-8">
        <h1 className="heading-editorial text-4xl flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-brand" />
          <span className="text-gradient">Outfit Calendar</span>
        </h1>
        <p className="text-taupe mt-2">
          Track what you wear each day
        </p>
      </div>

      {/* Streak summary */}
      {logsThisMonth > 0 && (
        <div className="animate-fade-in-up mb-6 flex items-center gap-2 text-sm" style={{ animationDelay: "0.3s" }}>
          <Flame className="h-4 w-4 text-gold" />
          <span className="text-[#8A7E74]">
            You&apos;ve logged <span className="font-semibold text-burgundy">{logsThisMonth}</span> {logsThisMonth === 1 ? "outfit" : "outfits"} this month
          </span>
        </div>
      )}

      <div className="animate-fade-in-up grid gap-8 md:grid-cols-2" style={{ animationDelay: "0.5s" }}>
        <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
          <CardContent className="p-6 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{ logged: loggedDates }}
              modifiersClassNames={{
                logged: "bg-brand/20 text-brand font-semibold ring-2 ring-brand/30 rounded-full",
              }}
              className="rounded-md w-full !p-4 [--cell-size:2.75rem] [&_[data-slot=calendar]]:w-full [&_table]:w-full"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-burgundy">
                {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
              </CardTitle>
              <CardDescription className="text-taupe">
                {selectedDateLog
                  ? "You logged an outfit for this day"
                  : "Log what you wore this day"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {outfits.length === 0 ? (
                <p className="text-sm text-taupe">
                  Save some outfits first to start logging them here.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-burgundy/80">Outfit</Label>
                    <Select
                      value={selectedOutfit}
                      onValueChange={(v) => setSelectedOutfit(v ?? "")}
                    >
                      <SelectTrigger className="bg-ivory border-taupe/40">
                        <SelectValue placeholder="Select an outfit" />
                      </SelectTrigger>
                      <SelectContent>
                        {outfits.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                            {o.occasion ? ` (${o.occasion})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-burgundy/80">Notes</Label>
                    <Textarea
                      placeholder="How did this outfit feel? Any notes?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="bg-ivory border-taupe/40"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveLog}
                      disabled={saving || !selectedOutfit}
                      className="flex-1 bg-burgundy hover:bg-burgundy-light gap-2 rounded-xl"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {selectedDateLog ? "Update Log" : "Log Outfit"}
                    </Button>
                    {selectedDateLog && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteLog}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {loggedOutfit && loggedOutfitItems.length > 0 && (
            <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-burgundy text-base">{loggedOutfit.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {loggedOutfitItems.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
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
                      <p className="text-xs text-center truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
                {selectedDateLog?.notes && (
                  <p className="text-sm text-taupe mt-3 italic">
                    &ldquo;{selectedDateLog.notes}&rdquo;
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
