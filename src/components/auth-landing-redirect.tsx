"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Supabase often redirects email confirmation to Site URL: `/?code=...`
 * (instead of /auth/callback). If middleware is skipped, full-nav here so
 * the route handler can run exchangeCodeForSession.
 */
function AuthLandingRedirectInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const q = searchParams.toString();
    window.location.replace(`/auth/callback${q ? `?${q}` : ""}`);
  }, [searchParams]);

  return null;
}

export function AuthLandingRedirect() {
  return (
    <Suspense fallback={null}>
      <AuthLandingRedirectInner />
    </Suspense>
  );
}
