import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApnsPush } from "@/lib/apns";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const RECENT_MS = 5 * 60 * 1000;
const TARGET_LABELS: Record<string, string> = { message: "bericht", user: "gebruiker", ad: "video", business: "bedrijf" };

// Na het indienen van een melding vraagt de app hier om de beheerders een
// pushmelding te sturen. De route kijkt zelf welke melding het is (de laatste
// van deze gebruiker) en stuurt nooit inhoud van de melding mee, alleen het
// soort en dat er iets te bekijken is.
export async function POST() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("consumers").select("id").eq("auth_user_id", userData.user.id).maybeSingle();
  if (!me) return NextResponse.json({ error: "Geen account." }, { status: 403 });

  // Hooguit 1 melding per minuut per melder: anders is dit een spammachine.
  if (!(await checkRateLimit(`reportnotify:${me.id}`, 1, 60))) {
    return NextResponse.json({ sent: 0, reason: "throttled" });
  }

  const { data: reports } = await admin
    .from("reports")
    .select("target_type, created_at")
    .eq("reporter_id", me.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const latest = reports?.[0];
  if (!latest || Date.now() - new Date(latest.created_at).getTime() > RECENT_MS) {
    return NextResponse.json({ sent: 0, reason: "no_recent_report" });
  }

  const { data: admins } = await admin.from("admins").select("auth_user_id");
  const adminAuthIds = (admins ?? []).map((a) => a.auth_user_id);
  if (adminAuthIds.length === 0) return NextResponse.json({ sent: 0, reason: "no_admin" });

  const { data: adminConsumers } = await admin.from("consumers").select("id").in("auth_user_id", adminAuthIds);
  const consumerIds = (adminConsumers ?? []).map((c) => c.id);
  if (consumerIds.length === 0) return NextResponse.json({ sent: 0, reason: "no_admin_device" });

  const { data: tokens } = await admin.from("push_tokens").select("id, token").in("consumer_id", consumerIds);
  if (!tokens || tokens.length === 0) return NextResponse.json({ sent: 0, reason: "no_admin_device" });

  let sent = 0;
  const stale: string[] = [];
  for (const t of tokens) {
    const result = await sendApnsPush(t.token, {
      title: "Nieuwe melding bij Swyp",
      body: `Een ${TARGET_LABELS[latest.target_type] ?? "item"} is gemeld. Bekijk het binnen 24 uur.`,
      url: "/admin/reports",
      threadId: "admin-reports",
    });
    if (result.ok) sent += 1;
    if (result.shouldRemoveToken) stale.push(t.id);
  }
  if (stale.length > 0) await admin.from("push_tokens").delete().in("id", stale);

  return NextResponse.json({ sent });
}
