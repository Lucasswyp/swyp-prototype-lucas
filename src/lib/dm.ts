import { createClient } from "@/lib/supabase/client";
import { notifyAdminsOfReport } from "@/lib/safety";

// Moet gelijk blijven aan de lijst in dm_react() (supabase/dm.sql); een test
// controleert dat.
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢", "👎", "😍", "💯"] as const;
// De snelle rij onder een doorgestuurde video: een beetje "cijfer geven".
export const VIDEO_RATING_EMOJIS = ["🔥", "😍", "😂", "💯", "👎"] as const;

export const MAX_MESSAGE_LENGTH = 1000;
export const SHARE_POINTS = 12;

export interface DmUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  conversationId: string;
  other: DmUser;
  lastKind: "text" | "video";
  lastBody: string | null;
  lastSenderIsMe: boolean;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationInfo {
  me: string;
  other: DmUser;
  iBlocked: boolean;
  blockedMe: boolean;
}

export interface DmMessage {
  id: string;
  conversationId: string;
  senderId: string;
  kind: "text" | "video";
  body: string | null;
  adId: string | null;
  createdAt: string;
  reactions: { consumerId: string; emoji: string }[];
}

export interface SendResult {
  ok: boolean;
  reason?: string;
  messageId?: string;
  awarded?: boolean;
  points?: number;
  balance?: number | null;
  awardReason?: string | null;
}

const ERROR_LABELS: Record<string, string> = {
  not_a_consumer: "Log eerst in om berichten te sturen.",
  invalid_user: "Je kunt dit niet naar jezelf sturen.",
  user_not_found: "Deze gebruiker bestaat niet meer.",
  blocked: "Je kunt deze persoon geen berichten sturen.",
  empty: "Typ eerst een bericht.",
  too_long: "Je bericht is te lang (max 1000 tekens).",
  rate_limited: "Rustig aan, je stuurt te snel. Probeer het zo opnieuw.",
  ad_not_available: "Deze video is niet meer beschikbaar.",
  conversation_not_found: "Dit gesprek bestaat niet meer.",
  message_not_found: "Dit bericht bestaat niet meer.",
  invalid_emoji: "Deze emoji kan niet.",
  invalid_kind: "Dit bericht kan niet verstuurd worden.",
  not_allowed: "Dit bericht bevat woorden die niet mogen op Swyp. Pas het aan en probeer het opnieuw.",
  suspended: "Je account is beperkt. Neem contact op via lucas@swyp.it.",
};

export function dmErrorLabel(reason?: string | null) {
  return (reason && ERROR_LABELS[reason]) || "Er ging iets mis. Probeer het opnieuw.";
}

/* eslint-disable @typescript-eslint/no-explicit-any -- ruwe rpc-rijen */
function mapUser(id: string, username: string | null, avatarUrl: string | null): DmUser {
  return { id, username: username ?? "onbekend", avatarUrl: avatarUrl ?? null };
}

export async function searchConsumers(query: string): Promise<DmUser[]> {
  const q = query.trim().replace(/^@/, "");
  if (q.length < 2) return [];
  const { data, error } = await createClient().rpc("dm_search_consumers", { p_query: q });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => mapUser(r.id, r.username, r.avatar_url));
}

export async function getOrCreateConversation(otherId: string): Promise<{ ok: boolean; conversationId?: string; reason?: string }> {
  const { data, error } = await createClient().rpc("dm_get_or_create_conversation", { p_other: otherId });
  if (error) throw error;
  return { ok: !!data?.ok, conversationId: data?.conversation_id, reason: data?.reason };
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await createClient().rpc("dm_list_conversations");
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    conversationId: r.conversation_id,
    other: mapUser(r.other_id, r.other_username, r.other_avatar_url),
    lastKind: r.last_kind,
    lastBody: r.last_body,
    lastSenderIsMe: !!r.last_sender_is_me,
    lastMessageAt: r.last_message_at,
    unreadCount: r.unread_count ?? 0,
  }));
}

export async function fetchConversationInfo(conversationId: string): Promise<ConversationInfo | null> {
  const { data, error } = await createClient().rpc("dm_conversation_info", { p_conversation_id: conversationId });
  if (error) throw error;
  if (!data?.ok) return null;
  return {
    me: data.me,
    other: mapUser(data.other_id, data.other_username, data.other_avatar_url),
    iBlocked: !!data.i_blocked,
    blockedMe: !!data.blocked_me,
  };
}

export async function fetchMessages(conversationId: string, limit = 80): Promise<DmMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, kind, body, ad_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const reactionsByMessage = new Map<string, { consumerId: string; emoji: string }[]>();
  if (rows.length > 0) {
    const { data: reactions, error: rErr } = await supabase
      .from("message_reactions")
      .select("message_id, consumer_id, emoji")
      .in("message_id", rows.map((r) => r.id));
    if (rErr) throw rErr;
    for (const r of (reactions ?? []) as any[]) {
      const list = reactionsByMessage.get(r.message_id) ?? [];
      list.push({ consumerId: r.consumer_id, emoji: r.emoji });
      reactionsByMessage.set(r.message_id, list);
    }
  }
  return rows
    .map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      kind: r.kind,
      body: r.body,
      adId: r.ad_id,
      createdAt: r.created_at,
      reactions: reactionsByMessage.get(r.id) ?? [],
    }))
    .reverse();
}

export async function sendMessage(
  conversationId: string,
  kind: "text" | "video",
  body: string | null,
  adId: string | null = null
): Promise<SendResult> {
  const { data, error } = await createClient().rpc("dm_send_message", {
    p_conversation_id: conversationId,
    p_kind: kind,
    p_body: body,
    p_ad_id: adId,
  });
  if (error) throw error;
  return {
    ok: !!data?.ok,
    reason: data?.reason,
    messageId: data?.message_id,
    awarded: !!data?.awarded,
    points: data?.points ?? 0,
    balance: data?.balance ?? null,
    awardReason: data?.award_reason ?? null,
  };
}

// Vraagt de server om de ontvanger een pushmelding te sturen. Een mislukte
// melding mag het versturen nooit in de weg zitten.
export function notifyRecipient(messageId: string | undefined) {
  if (!messageId) return;
  fetch("/api/push/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId }),
    keepalive: true,
  }).catch(() => {});
}

export async function reactToMessage(messageId: string, emoji: string): Promise<{ ok: boolean; action?: string; reason?: string }> {
  const { data, error } = await createClient().rpc("dm_react", { p_message_id: messageId, p_emoji: emoji });
  if (error) throw error;
  return { ok: !!data?.ok, action: data?.action, reason: data?.reason };
}

export async function markConversationRead(conversationId: string) {
  await createClient().rpc("dm_mark_read", { p_conversation_id: conversationId });
}

export async function fetchUnreadTotal(): Promise<number> {
  const { data, error } = await createClient().rpc("dm_unread_total");
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function setUserBlocked(otherId: string, blocked: boolean): Promise<boolean> {
  const { data, error } = await createClient().rpc("dm_block", { p_other: otherId, p_block: blocked });
  if (error) throw error;
  return !!data?.ok;
}

export async function reportMessage(reporterId: string, messageId: string, reason: string) {
  const { error } = await createClient().from("reports").insert({
    reporter_id: reporterId,
    target_type: "message",
    target_id: messageId,
    reason,
  });
  if (error) throw error;
  notifyAdminsOfReport();
}

export async function reportUser(reporterId: string, userId: string, reason: string) {
  const { error } = await createClient().from("reports").insert({
    reporter_id: reporterId,
    target_type: "user",
    target_id: userId,
    reason,
  });
  if (error) throw error;
  notifyAdminsOfReport();
}

export function groupReactions(reactions: { consumerId: string; emoji: string }[], meId: string) {
  const map = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const r of reactions) {
    const cur = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    cur.count += 1;
    if (r.consumerId === meId) cur.mine = true;
    map.set(r.emoji, cur);
  }
  return [...map.values()];
}

// Tekst die in de gesprekkenlijst onder de naam staat.
export function previewText(c: Pick<ConversationSummary, "lastKind" | "lastBody" | "lastSenderIsMe">) {
  const prefix = c.lastSenderIsMe ? "Jij: " : "";
  if (c.lastKind === "video") return `${prefix}🎬 Video${c.lastBody ? ` · ${c.lastBody}` : ""}`;
  return `${prefix}${c.lastBody ?? ""}`;
}
