import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApnsPush } from "@/lib/apns";
import { buildDmPushPayload } from "@/lib/dmPush";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Alleen een bericht van de laatste paar minuten mag nog een melding geven,
// zodat een oude message-id niet opnieuw gebruikt kan worden.
const MAX_AGE_MS = 3 * 60 * 1000;

// De afzender meldt "dit bericht is net verstuurd"; de server controleert dat
// het echt zijn bericht is en stuurt dan een pushmelding naar de ontvanger.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messageId = body?.messageId;
  if (typeof messageId !== "string" || !UUID.test(messageId)) {
    return NextResponse.json({ error: "Ongeldig bericht." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("consumers").select("id, username").eq("auth_user_id", userData.user.id).maybeSingle();
  if (!me) return NextResponse.json({ error: "Geen account." }, { status: 403 });

  // Hooguit 60 meldingen per minuut per afzender.
  if (!(await checkRateLimit(`dmpush:sender:${me.id}`, 60, 60))) {
    return NextResponse.json({ sent: 0, reason: "rate_limited" }, { status: 429 });
  }

  const { data: message } = await admin
    .from("messages")
    .select("id, conversation_id, sender_id, kind, body, created_at")
    .eq("id", messageId)
    .maybeSingle();
  if (!message || message.sender_id !== me.id) {
    return NextResponse.json({ error: "Bericht niet gevonden." }, { status: 404 });
  }
  if (Date.now() - new Date(message.created_at).getTime() > MAX_AGE_MS) {
    return NextResponse.json({ sent: 0, reason: "too_old" });
  }

  const { data: conversation } = await admin
    .from("conversations")
    .select("user_a, user_b")
    .eq("id", message.conversation_id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Gesprek niet gevonden." }, { status: 404 });
  const recipientId = conversation.user_a === me.id ? conversation.user_b : conversation.user_a;

  // Geblokkeerd, in welke richting dan ook: geen melding.
  const { data: blocks } = await admin
    .from("dm_blocks")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${me.id},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${me.id})`)
    .limit(1);
  if (blocks && blocks.length > 0) return NextResponse.json({ sent: 0, reason: "blocked" });

  // Eén melding per gesprek per 20 seconden: een rij snelle berichten geeft geen trillingsstorm.
  if (!(await checkRateLimit(`dmpush:conv:${message.conversation_id}:${recipientId}`, 1, 20))) {
    return NextResponse.json({ sent: 0, reason: "throttled" });
  }

  const { data: tokens } = await admin.from("push_tokens").select("id, token").eq("consumer_id", recipientId);
  if (!tokens || tokens.length === 0) return NextResponse.json({ sent: 0, reason: "no_device" });

  const payload = buildDmPushPayload({
    senderUsername: me.username,
    kind: message.kind,
    body: message.body,
    conversationId: message.conversation_id,
  });

  let sent = 0;
  const stale: string[] = [];
  for (const t of tokens) {
    const result = await sendApnsPush(t.token, payload);
    if (result.ok) sent += 1;
    if (result.shouldRemoveToken) stale.push(t.id);
  }
  if (stale.length > 0) await admin.from("push_tokens").delete().in("id", stale);

  return NextResponse.json({ sent });
}
