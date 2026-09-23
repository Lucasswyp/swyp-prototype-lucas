import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApnsPush } from "@/lib/apns";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel signs every cron-triggered request with this header (see
// vercel.json's `crons` entry) — without it, this endpoint would be a public
// URL anyone could hit to spam every consumer's phone.
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
  // Same "what day is it" convention award_interaction() uses for streaks
  // (supabase/rewards.sql) — Europe/Amsterdam, not UTC or the server's own.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });

  const { data: atRisk, error } = await admin
    .from("consumer_streaks")
    .select("consumer_id, current_streak, last_active_date")
    .gt("current_streak", 0)
    .or(`last_active_date.is.null,last_active_date.lt.${today}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!atRisk || atRisk.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, pruned: 0 });
  }

  const consumerIds = atRisk.map((r) => r.consumer_id);
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("id, consumer_id, token")
    .in("consumer_id", consumerIds);

  let sent = 0;
  let failed = 0;
  const toPrune: string[] = [];

  for (const streak of atRisk) {
    const deviceTokens = (tokens ?? []).filter((t) => t.consumer_id === streak.consumer_id);
    for (const deviceToken of deviceTokens) {
      const result = await sendApnsPush(deviceToken.token, {
        title: "Je streak loopt gevaar 🔥",
        body: `Je hebt een streak van ${streak.current_streak} ${streak.current_streak === 1 ? "dag" : "dagen"} — swipe vandaag nog om 'm te behouden!`,
      });
      if (result.ok) sent += 1;
      else failed += 1;
      if (result.shouldRemoveToken) toPrune.push(deviceToken.id);
    }
  }

  if (toPrune.length > 0) {
    await admin.from("push_tokens").delete().in("id", toPrune);
  }

  return NextResponse.json({ sent, failed, pruned: toPrune.length });
}
