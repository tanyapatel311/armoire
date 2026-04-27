import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function safeNextPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const err = searchParams.get("error");
  const errDesc = searchParams.get("error_description");

  if (err) {
    const p = new URLSearchParams();
    p.set("error", "auth");
    if (errDesc) p.set("message", errDesc);
    return NextResponse.redirect(`${origin}/login?${p.toString()}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Build redirect first, then attach Set-Cookie on that response (required in Route Handlers;
  // using only `cookies()` from next/headers can fail to persist the session on redirect).
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return response;
}
