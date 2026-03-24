import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

Important: Only use item IDs that exist in the wardrobe list above. Pick items that work well together in terms of color, style, and the specified occasion/season.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;
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
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate outfit. Please try again." },
      { status: 500 }
    );
  }
}
