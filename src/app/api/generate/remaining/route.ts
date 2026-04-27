import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = 5;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ remaining: DAILY_LIMIT });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("generation_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString());

    if (error) {
      return NextResponse.json({ remaining: DAILY_LIMIT });
    }

    return NextResponse.json({ remaining: Math.max(0, DAILY_LIMIT - (count ?? 0)) });
  } catch {
    return NextResponse.json({ remaining: DAILY_LIMIT });
  }
}
