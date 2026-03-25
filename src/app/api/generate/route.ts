import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Add GEMINI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized — please log in again." }, { status: 401 });
    }

    const { occasion, season, notes } = await request.json();

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

    const closetSummary = items
      .map(
        (item) =>
          `- ID: ${item.id} | ${item.name} (${item.category}) | Color: ${item.color || "unknown"} | Season: ${item.season || "all"} | Brand: ${item.brand || "unknown"}`
      )
      .join("\n");

    const prompt = `You are a professional fashion stylist. Based on the user's wardrobe below, create a complete outfit recommendation.

WARDROBE:
${closetSummary}

OCCASION: ${occasion || "Casual"}
SEASON/WEATHER: ${season || "Any"}
${notes ? `ADDITIONAL NOTES: ${notes}` : ""}

Create ONE complete outfit using ONLY items from their wardrobe. Return your response as valid JSON with this exact structure:
{
  "name": "A creative name for the outfit",
  "item_ids": ["id1", "id2", ...],
  "reasoning": "A 2-3 sentence explanation of why these items work together, including color coordination, style matching, and occasion appropriateness.",
  "styling_tips": "One or two quick styling tips for wearing this outfit."
}

Important: Only use item IDs that exist in the wardrobe list above. Pick items that work well together in terms of color, style, and the specified occasion/season. Return ONLY valid JSON, no markdown.`;

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

    return NextResponse.json({
      name: outfit.name,
      items: selectedItems,
      item_ids: outfit.item_ids,
      reasoning: outfit.reasoning,
      styling_tips: outfit.styling_tips,
      occasion,
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
