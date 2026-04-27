import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = 5;

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const msg = errorData?.error?.message || `Gemini API error: ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function buildPrompt(
  closetSummary: string,
  occasion?: string,
  season?: string,
  weather?: string,
  style?: string,
  notes?: string
) {
  return `You are a professional fashion stylist. Based on the user's wardrobe below, create a complete outfit recommendation.

WARDROBE (only clean/available items):
${closetSummary}

OCCASION: ${occasion || "Casual"}
SEASON: ${season || "Any"}
${weather ? `WEATHER: ${weather}` : ""}
${style ? `STYLE PREFERENCE: ${style}` : ""}
${notes ? `ADDITIONAL NOTES: ${notes}` : ""}

Create ONE complete outfit using ONLY items from their wardrobe. Return your response as valid JSON with this exact structure:
{
  "name": "A creative name for the outfit",
  "item_ids": ["id1", "id2", ...],
  "reasoning": "A 2-3 sentence explanation of why these items work together, including color coordination, style matching, and occasion appropriateness.",
  "styling_tips": "One or two quick styling tips for wearing this outfit."
}

Important: Only use item IDs that exist in the wardrobe list above. Pick items that work well together in terms of color, style, and the specified occasion/season. Return ONLY valid JSON, no markdown.`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Add GEMINI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { occasion, season, weather, style, notes, guestItems } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // --- Guest path: items provided in request body ---
    if (!user) {
      if (!guestItems || !Array.isArray(guestItems) || guestItems.length === 0) {
        return NextResponse.json(
          { error: "Add some clothing items to your closet first!" },
          { status: 400 }
        );
      }

      const availableItems = guestItems.filter((item: { in_laundry?: boolean }) => !item.in_laundry);
      if (availableItems.length === 0) {
        return NextResponse.json(
          { error: "All your clothes are in the laundry! Mark some as clean first." },
          { status: 400 }
        );
      }

      const closetSummary = availableItems
        .map(
          (item: { id: string; name: string; category: string; color?: string; season?: string; brand?: string }) =>
            `- ID: ${item.id} | ${item.name} (${item.category}) | Color: ${item.color || "unknown"} | Season: ${item.season || "all"} | Brand: ${item.brand || "unknown"}`
        )
        .join("\n");

      const prompt = buildPrompt(closetSummary, occasion, season, weather, style, notes);
      const content = await callGemini(apiKey, prompt);

      if (!content) {
        return NextResponse.json({ error: "Failed to generate outfit" }, { status: 500 });
      }

      const outfit = JSON.parse(content);
      const selectedItems = availableItems.filter((item: { id: string }) =>
        outfit.item_ids.includes(item.id)
      );

      return NextResponse.json({
        name: outfit.name,
        items: selectedItems,
        item_ids: outfit.item_ids,
        reasoning: outfit.reasoning,
        styling_tips: outfit.styling_tips,
        occasion,
      });
    }

    // --- Authenticated path ---

    // Rate limit check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("generation_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString());

    if (!countError && count !== null && count >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used all ${DAILY_LIMIT} outfit generations for today. Come back tomorrow!`,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const { data: items, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "You need to add some clothing items to your closet first!" },
        { status: 400 }
      );
    }

    const availableItems = items.filter((item) => !item.in_laundry);

    if (availableItems.length === 0) {
      return NextResponse.json(
        { error: "All your clothes are in the laundry! Mark some as clean first." },
        { status: 400 }
      );
    }

    const closetSummary = availableItems
      .map(
        (item) =>
          `- ID: ${item.id} | ${item.name} (${item.category}) | Color: ${item.color || "unknown"} | Season: ${item.season || "all"} | Brand: ${item.brand || "unknown"}`
      )
      .join("\n");

    const prompt = buildPrompt(closetSummary, occasion, season, weather, style, notes);
    const content = await callGemini(apiKey, prompt);

    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate outfit" },
        { status: 500 }
      );
    }

    const outfit = JSON.parse(content);

    const selectedItems = items.filter((item) =>
      outfit.item_ids.includes(item.id)
    );

    // Log generation for rate limiting
    await supabase.from("generation_log").insert({ user_id: user.id });

    const remaining = DAILY_LIMIT - ((count ?? 0) + 1);

    return NextResponse.json({
      name: outfit.name,
      items: selectedItems,
      item_ids: outfit.item_ids,
      reasoning: outfit.reasoning,
      styling_tips: outfit.styling_tips,
      occasion,
      remaining,
    });
  } catch (err: unknown) {
    console.error("Generate error:", err);

    let message = "Failed to generate outfit. Please try again.";
    if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
