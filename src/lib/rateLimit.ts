import { createAdminClient } from "@/lib/supabase/admin";

// Fails open (allows the request) if the check itself errors — a rate
// limiter outage shouldn't take down the feature it's protecting.
export async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) return true;
  return data === true;
}

// Vercel sets x-forwarded-for on every request; the first entry is the
// original client (later ones are proxies/load balancers in between).
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
