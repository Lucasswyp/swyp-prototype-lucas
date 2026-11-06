import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPendingDigest, readMailConfig, sendMail, type PendingAd } from "@/lib/pendingDigest";

export const runtime = "nodejs";
export const maxDuration = 30;

// Zoals de andere cron-routes: alleen aanroepbaar met het geheim dat Vercel meestuurt.
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ads")
    .select("id, caption, created_at, business_id")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bedrijfsnamen apart ophalen, zodat dit niet afhangt van een koppeling tussen de tabellen.
  const ids = [...new Set((data ?? []).map((a) => a.business_id).filter(Boolean))];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: biz } = await admin.from("businesses").select("id, name").in("id", ids);
    for (const b of biz ?? []) names.set(b.id, b.name);
  }

  const pending: PendingAd[] = (data ?? []).map((a) => ({
    id: a.id,
    caption: a.caption,
    created_at: a.created_at,
    business: names.get(a.business_id) ?? null,
  }));

  const digest = buildPendingDigest(pending, "https://swyp.it/admin/ads");
  if (!digest) return NextResponse.json({ pending: 0, sent: false });

  const result = await sendMail(readMailConfig(process.env), digest);
  return NextResponse.json({ pending: pending.length, ...result });
}
