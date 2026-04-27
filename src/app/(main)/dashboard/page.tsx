"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useGuest } from "@/lib/guest-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shirt,
  Layers,
  CalendarDays,
  CloudSun,
  Cloud,
  CloudRain,
  Snowflake,
  Sun,
  Wind,
  Thermometer,
  Loader2,
  Plus,
  Sparkles,
  WashingMachine,
  MapPin,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { ClothingItem, Outfit, ClothingCategory } from "@/types";
import { CATEGORIES } from "@/types";

function AnimatedNumber({ value, duration = 600, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    timerRef.current = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay]);

  return <>{display}</>;
}

interface WeatherData {
  temperature: number;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  condition: string;
  city: string;
}

interface OutfitWithItems extends Outfit {
  clothing_items: ClothingItem[];
}

const CATEGORY_COLORS: Record<ClothingCategory, string> = {
  tops: "#0D6B63",
  bottoms: "#3B0A14",
  dresses: "#321254",
  outerwear: "#1FA297",
  shoes: "#C5973E",
  accessories: "#601226",
};

function getWeatherCondition(code: number): string {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rainy";
  if (code >= 71 && code <= 77) return "Snowy";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Cloudy";
}

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  switch (condition) {
    case "Clear":
      return <Sun className={className} />;
    case "Rainy":
    case "Showers":
      return <CloudRain className={className} />;
    case "Snowy":
      return <Snowflake className={className} />;
    case "Cloudy":
    case "Foggy":
      return <Cloud className={className} />;
    case "Thunderstorm":
      return <CloudRain className={className} />;
    default:
      return <CloudSun className={className} />;
  }
}

function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function CategoryPieChart({
  data,
}: {
  data: { category: ClothingCategory; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return null;

  const segments: { category: ClothingCategory; count: number; startAngle: number; endAngle: number }[] = [];
  let currentAngle = 0;
  for (const d of data) {
    if (d.count === 0) continue;
    const angle = (d.count / total) * 360;
    segments.push({
      category: d.category,
      count: d.count,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    });
    currentAngle += angle;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-56 h-56 shrink-0">
        {segments.length === 1 ? (
          <circle cx={100} cy={100} r={90} fill={CATEGORY_COLORS[segments[0].category]} />
        ) : (
          segments.map((seg) => (
            <path
              key={seg.category}
              d={arcPath(100, 100, 90, seg.startAngle, seg.endAngle)}
              fill={CATEGORY_COLORS[seg.category]}
              stroke="white"
              strokeWidth={2}
            />
          ))
        )}
        <circle cx={100} cy={100} r={50} fill="white" />
        <text x={100} y={95} textAnchor="middle" className="text-2xl font-bold" fill="#601226">
          {total}
        </text>
        <text x={100} y={115} textAnchor="middle" className="text-xs" fill="#8A7E74">
          items
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {data
          .filter((d) => d.count > 0)
          .map((d) => {
            const label = CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category;
            return (
              <div key={d.category} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[d.category] }}
                />
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-burgundy">{d.count}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function getSeasonFromTemp(tempC: number): string {
  if (tempC >= 28) return "summer";
  if (tempC >= 18) return "spring";
  if (tempC >= 5) return "fall";
  return "winter";
}

function scoreOutfit(
  outfit: Outfit,
  itemsMap: Map<string, { season: string | null; category: string }>,
  targetSeason: string,
  tempC: number | null
): number {
  let score = 0;
  const ids = outfit.items as string[];
  if (ids.length === 0) return -1;

  for (const id of ids) {
    const item = itemsMap.get(id);
    if (!item) continue;

    const seasons = (item.season || "").toLowerCase().split(",").map((s) => s.trim());

    if (seasons.includes(targetSeason)) {
      score += 2;
    } else if (seasons.includes("all") || !item.season) {
      score += 0.5;
    } else {
      score -= 1;
    }

    if (tempC !== null) {
      if (tempC >= 28 && item.category === "outerwear") score -= 2;
      if (tempC < 5 && item.category === "outerwear") score += 2;
    }
  }

  return score / ids.length;
}

export default function DashboardPage() {
  const { isGuest, guestItems, guestOutfits, isLoading: guestLoading } = useGuest();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalOutfits, setTotalOutfits] = useState(0);
  const [laundryCount, setLaundryCount] = useState(0);
  const [monthlyLogs, setMonthlyLogs] = useState(0);
  const [categoryData, setCategoryData] = useState<
    { category: ClothingCategory; count: number }[]
  >([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [suggestedOutfit, setSuggestedOutfit] = useState<OutfitWithItems | null>(null);
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, { season: string | null; category: string }>>(new Map());
  const [outfitsPicked, setOutfitsPicked] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchWeather = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );

      const { latitude, longitude } = position.coords;

      const [weatherRes, geoRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
        ),
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
        ),
      ]);

      const weatherJson = await weatherRes.json();
      const geoJson = await geoRes.json();

      const temp = weatherJson.current.temperature_2m as number;
      const code = weatherJson.current.weather_code as number;
      const tempMax = weatherJson.daily?.temperature_2m_max?.[0] ?? temp;
      const tempMin = weatherJson.daily?.temperature_2m_min?.[0] ?? temp;

      const city =
        geoJson.address?.city ||
        geoJson.address?.town ||
        geoJson.address?.village ||
        geoJson.address?.county ||
        "Your Area";

      setWeather({
        temperature: Math.round(temp),
        tempMax: Math.round(tempMax),
        tempMin: Math.round(tempMin),
        weatherCode: code,
        condition: getWeatherCondition(code),
        city,
      });
    } catch {
      // location denied or fetch failed
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (isGuest) {
      setUserName("there");
      setTotalItems(guestItems.length);
      setLaundryCount(guestItems.filter((i) => i.in_laundry).length);
      setTotalOutfits(guestOutfits.length);
      setMonthlyLogs(0);

      const itemMap = new Map<string, { season: string | null; category: string }>();
      const catCounts: Record<ClothingCategory, number> = {
        tops: 0, bottoms: 0, dresses: 0, outerwear: 0, shoes: 0, accessories: 0,
      };
      for (const item of guestItems) {
        itemMap.set(item.id, { season: item.season, category: item.category });
        if (item.category in catCounts) {
          catCounts[item.category as ClothingCategory]++;
        }
      }
      setClothingMap(itemMap);
      setCategoryData(
        CATEGORIES.map((c) => ({ category: c.value, count: catCounts[c.value] }))
      );

      if (guestOutfits.length > 0) {
        const go = guestOutfits[0];
        const itemsMap = new Map(guestItems.map((i) => [i.id, i]));
        setSuggestedOutfit({
          id: "guest-outfit",
          user_id: "guest",
          name: go.name,
          occasion: go.occasion || null,
          items: go.item_ids,
          ai_reasoning: go.reasoning,
          created_at: new Date().toISOString(),
          clothing_items: go.item_ids
            .map((id) => itemsMap.get(id))
            .filter(Boolean) as ClothingItem[],
        });
        setOutfitsPicked(true);
      }

      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUserName(
        profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "there"
      );

      const { data: items } = await supabase
        .from("clothing_items")
        .select("id, category, in_laundry, season");

      const allItems = items || [];
      setTotalItems(allItems.length);
      setLaundryCount(allItems.filter((i) => i.in_laundry).length);

      const itemMap = new Map<string, { season: string | null; category: string }>();
      for (const item of allItems) {
        itemMap.set(item.id, { season: item.season, category: item.category });
      }
      setClothingMap(itemMap);

      const catCounts: Record<ClothingCategory, number> = {
        tops: 0, bottoms: 0, dresses: 0, outerwear: 0, shoes: 0, accessories: 0,
      };
      for (const item of allItems) {
        if (item.category in catCounts) {
          catCounts[item.category as ClothingCategory]++;
        }
      }
      setCategoryData(
        CATEGORIES.map((c) => ({ category: c.value, count: catCounts[c.value] }))
      );

      const { data: outfits } = await supabase.from("outfits").select("*");
      const fetchedOutfits = (outfits || []) as Outfit[];
      setTotalOutfits(fetchedOutfits.length);
      setAllOutfits(fetchedOutfits);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const { count: logCount } = await supabase
        .from("outfit_log")
        .select("id", { count: "exact", head: true })
        .gte("date_worn", monthStart)
        .lte("date_worn", monthEnd);

      setMonthlyLogs(logCount ?? 0);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [supabase, isGuest, guestItems, guestOutfits]);

  useEffect(() => {
    if (!guestLoading) {
      fetchData();
      fetchWeather();
    }
  }, [fetchData, fetchWeather, guestLoading]);

  useEffect(() => {
    if (outfitsPicked || loading || weatherLoading) return;
    if (allOutfits.length === 0) { setOutfitsPicked(true); return; }

    const season = weather ? getSeasonFromTemp(weather.temperature) : getCurrentSeason();
    const tempC = weather ? weather.temperature : null;

    const scored = allOutfits.map((outfit) => ({
      outfit,
      score: scoreOutfit(outfit, clothingMap, season, tempC),
    }));
    scored.sort((a, b) => b.score - a.score);

    const bestScore = scored[0].score;
    const topOutfits = scored.filter((s) => s.score >= bestScore - 0.5);
    const chosen = topOutfits[Math.floor(Math.random() * topOutfits.length)].outfit;

    const itemIds = chosen.items as string[];
    if (itemIds.length > 0) {
      supabase
        .from("clothing_items")
        .select("*")
        .in("id", itemIds)
        .then(({ data }) => {
          setSuggestedOutfit({
            ...chosen,
            clothing_items: (data || []) as ClothingItem[],
          });
          setOutfitsPicked(true);
        });
    } else {
      setSuggestedOutfit({ ...chosen, clothing_items: [] });
      setOutfitsPicked(true);
    }
  }, [loading, weatherLoading, allOutfits, clothingMap, weather, outfitsPicked, supabase]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Guest banner */}
      {isGuest && (
        <div className="animate-fade-in-up flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-xl px-4 py-3">
          <Info className="h-4 w-4 text-brand shrink-0" />
          <p className="text-sm text-brand">
            You&apos;re exploring as a guest. Your data won&apos;t be saved.{" "}
            <Link href="/signup" className="underline underline-offset-2 font-medium hover:text-brand/80">
              Create an account
            </Link>{" "}
            to keep everything.
          </p>
        </div>
      )}

      {/* Greeting */}
      <div className="animate-fade-in-up">
        <h1 className="heading-editorial text-2xl">
          <span className="text-gradient">{getGreeting()}{isGuest ? "" : `, ${userName.split(" ")[0]}`}</span> 👋
        </h1>
        <p className="text-[#8A7E74] text-sm mt-0.5">{dateStr}</p>
      </div>

      {/* Stats Row */}
      <div className="animate-fade-in-up grid grid-cols-2 md:grid-cols-4 gap-3" style={{ animationDelay: "0.3s" }}>
        {[
          { icon: Shirt, value: totalItems, label: "Items in closet", link: "/closet", linkText: "View closet →", bg: "bg-brand/10", color: "text-brand" },
          { icon: Layers, value: totalOutfits, label: "Saved outfits", link: "/outfits", linkText: "View outfits →", bg: "bg-purple/10", color: "text-purple" },
          { icon: WashingMachine, value: laundryCount, label: "Laundry", link: "/closet", linkText: "View items →", bg: "bg-gold/10", color: "text-gold" },
          { icon: CalendarDays, value: monthlyLogs, label: "Outfits this month", link: "/calendar", linkText: "View calendar →", bg: "bg-burgundy/10", color: "text-burgundy" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#E8DDD0] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} shrink-0`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-2xl font-bold text-[#2D1F1B]"><AnimatedNumber value={stat.value} delay={2100} /></span>
              </div>
              <p className="text-xs text-[#8A7E74]">{stat.label}</p>
              <Link href={stat.link} className="text-xs text-brand hover:text-brand-light transition-colors">
                {stat.linkText}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outfit of the Day + Closet Breakdown side by side */}
      <div className="animate-fade-in-up grid lg:grid-cols-2 gap-6" style={{ animationDelay: "0.6s" }}>
        {/* Outfit of the Day — LEFT */}
        <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm overflow-hidden">
          <CardHeader className="pb-2 gold-accent-left ml-4">
            <CardTitle className="font-heading text-lg text-burgundy flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              Outfit of the Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* LEFT: Outfit in decorative circle */}
              <div className="shrink-0 relative">
                {suggestedOutfit && suggestedOutfit.clothing_items.length > 0 ? (
                  <div className="relative w-52 h-52">
                    {/* Decorative circle border with teal-gold gradient */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 208 208">
                      <defs>
                        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#C5973E" />
                          <stop offset="50%" stopColor="#0D6B63" />
                          <stop offset="100%" stopColor="#0D6B63" />
                        </linearGradient>
                      </defs>
                      <circle cx="104" cy="104" r="100" fill="none" stroke="url(#circleGrad)" strokeWidth="2.5" />
                    </svg>
                    {/* Clothing items inside the circle */}
                    <div className="absolute inset-3 rounded-full overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
                      <div className="flex items-center justify-center gap-1 p-2">
                        {suggestedOutfit.clothing_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="relative w-16 h-20">
                            {item.image_url ? (
                              <Image src={item.image_url} alt={item.name} fill className="object-contain" sizes="64px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground text-center">{item.name}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-full border-2 border-dashed border-[#E8DDD0] flex flex-col items-center justify-center text-center p-4">
                    <Layers className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-[11px] text-muted-foreground">Save outfits to get daily suggestions</p>
                  </div>
                )}
              </div>

              {/* RIGHT: Outfit info + Weather */}
              <div className="flex-1 min-w-0 space-y-3">
                {suggestedOutfit ? (
                  <div>
                    <p className="font-semibold text-burgundy text-sm">{suggestedOutfit.name}</p>
                    {suggestedOutfit.occasion && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-burgundy/8 text-burgundy border-0">{suggestedOutfit.occasion}</Badge>
                    )}
                    {suggestedOutfit.ai_reasoning && (
                      <p className="text-xs text-[#8A7E74] mt-1.5 line-clamp-2">{suggestedOutfit.ai_reasoning}</p>
                    )}
                    <Link href={`/outfits/${suggestedOutfit.id}`}>
                      <Button size="sm" className="mt-2 bg-brand hover:bg-brand-light text-xs h-7 rounded-lg gap-1">
                        View Outfit
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/outfits/create">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                        <Plus className="h-3 w-3" /> Create
                      </Button>
                    </Link>
                    <Link href="/generate">
                      <Button size="sm" className="bg-brand hover:bg-brand-light gap-1 text-xs h-7">
                        <Sparkles className="h-3 w-3" /> Generate
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Weather widget */}
                {weatherLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Checking weather...</span>
                  </div>
                ) : weather ? (
                  <div className="rounded-xl bg-gradient-to-br from-brand to-brand-dark p-3 text-white">
                    <div className="flex items-center gap-1.5 text-white/70 text-[10px] mb-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {weather.city}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WeatherIcon condition={weather.condition} className="h-6 w-6 text-mint" />
                        <div>
                          <p className="text-lg font-bold leading-tight">{cToF(weather.temperature)}°F</p>
                          <p className="text-white/70 text-[10px]">{weather.condition}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-2.5 w-2.5 text-red-300" />
                          <span>H: {cToF(weather.tempMax)}°</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-2.5 w-2.5 text-blue-300" />
                          <span>L: {cToF(weather.tempMin)}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted p-3 text-center">
                    <Wind className="h-5 w-5 text-muted-foreground/40 mx-auto mb-0.5" />
                    <p className="text-[10px] text-muted-foreground">Enable location for weather</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Closet Breakdown — RIGHT */}
        <Card className="bg-white rounded-2xl border border-[#E8DDD0] shadow-sm">
          <CardHeader className="gold-accent-left ml-4">
            <CardTitle className="font-heading text-lg text-burgundy flex items-center gap-2">
              <Shirt className="h-5 w-5 text-gold" />
              Closet Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shirt className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">Add items to see the breakdown</p>
                <Link href="/closet/add" className="mt-3">
                  <Button size="sm" className="bg-brand hover:bg-brand-light gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </Link>
              </div>
            ) : (
              <CategoryPieChart data={categoryData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
