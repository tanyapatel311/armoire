/**
 * Where the browser / Supabase should return after email confirmation and OAuth.
 * - In the browser, always the current tab origin (so production, preview, and local all work).
 * - Add each URL (or a wildcard) under Supabase → Authentication → URL configuration → Redirect URLs
 *   e.g. `https://yourapp.vercel.app/**`, `http://localhost:3000/**`
 * - In Vercel, set `NEXT_PUBLIC_SITE_URL` to your production URL if you add server code that
 *   must build a URL without `window` (e.g. `https://armoire.yourdomain.com`)
 */
export function getAuthCallbackUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) {
    return `${site}/auth/callback`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/auth/callback`;
  }
  return "http://localhost:3000/auth/callback";
}
