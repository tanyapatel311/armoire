"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Loader2, CalendarDays, Save } from "lucide-react";
import { format } from "date-fns";
import type { Outfit, OutfitLog } from "@/types";
import { toast } from "sonner";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [logs, setLogs] = useState<OutfitLog[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const loggedDates = logs.map((l) => new Date(l.date_worn));

  const fetchData = useCallback(async () => {
    const [outfitsRes, logsRes] = await Promise.all([
      supabase.from("outfits").select("*").order("created_at", { ascending: false }),
      supabase.from("outfit_log").select("*").order("date_worn", { ascending: false }),
    ]);

    if (outfitsRes.data) setOutfits(outfitsRes.data.map(o => ({ ...o, items: o.items as string[] })));
    if (logsRes.data) setLogs(logsRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedDateLog = date
    ? logs.find((l) => l.date_worn === format(date, "yyyy-MM-dd"))
    : null;

  async function handleSaveLog() {
    if (!date || !selectedOutfit) {
      toast.error("Please select a date and outfit");
      return;
    }

    setSaving(true);
    const dateStr = format(date, "yyyy-MM-dd");

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
      const { error } = await supabase.from("outfit_log").insert({
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

  useEffect(() => {
    if (selectedDateLog) {
      setSelectedOutfit(selectedDateLog.outfit_id || "");
      setNotes(selectedDateLog.notes || "");
    } else {
      setSelectedOutfit("");
      setNotes("");
    }
  }, [selectedDateLog]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-rose-500" />
          Outfit Calendar
        </h1>
        <p className="text-muted-foreground mt-1">
          Track what you wear each day
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{ logged: loggedDates }}
              modifiersClassNames={{
                logged: "bg-rose-100 text-rose-900 font-semibold",
              }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
            </CardTitle>
            <CardDescription>
              {selectedDateLog
                ? "Edit your outfit log for this day"
                : "Log what you wore this day"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outfits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Save some outfits first to start logging them here.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Outfit</Label>
                  <Select
                    value={selectedOutfit}
                    onValueChange={(v) => setSelectedOutfit(v ?? "")}
                  >
                    <SelectTrigger>
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
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="How did this outfit feel? Any notes?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSaveLog}
                  disabled={saving || !selectedOutfit}
                  className="w-full bg-rose-500 hover:bg-rose-600 gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {selectedDateLog ? "Update Log" : "Log Outfit"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
