"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreVertical, Send, PlayCircle, Ban, Flag, X, Smile } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AdThumb } from "@/components/consumer/AdThumb";
import { useData } from "@/contexts/DataContext";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_MESSAGE_LENGTH,
  REACTION_EMOJIS,
  VIDEO_RATING_EMOJIS,
  dmErrorLabel,
  fetchConversationInfo,
  fetchMessages,
  groupReactions,
  markConversationRead,
  reactToMessage,
  reportMessage,
  reportUser,
  sendMessage,
  setUserBlocked,
  type ConversationInfo,
  type DmMessage,
} from "@/lib/dm";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  { value: "inappropriate", label: "Ongepaste berichten" },
  { value: "spam", label: "Spam" },
  { value: "scam", label: "Oplichting" },
  { value: "other", label: "Anders" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Vandaag";
  if (d.toDateString() === yesterday.toDateString()) return "Gisteren";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, requireAuth } = useConsumerAuth();
  const { ads, products, companies } = useData();

  const [info, setInfo] = useState<ConversationInfo | null>(null);
  const [missing, setMissing] = useState(false);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);

  const refreshInfo = useCallback(async () => {
    const next = await fetchConversationInfo(id);
    if (!next) setMissing(true);
    else setInfo(next);
  }, [id]);

  const refreshMessages = useCallback(async () => {
    const list = await fetchMessages(id);
    setMessages(list);
    setLoaded(true);
  }, [id]);

  // Eerste keer laden, daarna elke paar seconden en bij elk nieuw bericht of
  // elke reactie (realtime, met de polling als vangnet).
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    const safe = (fn: () => Promise<void>) => () => {
      fn().catch(() => {
        if (!cancelled) setLoaded(true);
      });
    };
    const loadAll = safe(async () => {
      await Promise.all([refreshInfo(), refreshMessages()]);
    });
    loadAll();
    const supabase = createClient();
    const channel = supabase
      .channel(`swyp-dm-thread-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, safe(refreshMessages))
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, safe(refreshMessages))
      .subscribe();
    const interval = window.setInterval(() => {
      safe(refreshMessages)();
      safe(refreshInfo)();
    }, 4000);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [id, isLoggedIn, refreshInfo, refreshMessages]);

  // Gelezen markeren zodra er iets nieuws van de ander is.
  const newestFromOther = useMemo(() => {
    if (!info) return null;
    const last = [...messages].reverse().find((m) => m.senderId !== info.me);
    return last?.id ?? null;
  }, [messages, info]);

  useEffect(() => {
    if (!isLoggedIn || !info) return;
    markConversationRead(id).then(() => window.dispatchEvent(new Event("swyp-dm-read")));
  }, [id, isLoggedIn, info, newestFromOther]);

  // Onderaan blijven, tenzij iemand omhoog heeft gescrold om oudere berichten te lezen.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length !== lastCount.current && (stickToBottom.current || lastCount.current === 0)) {
      el.scrollTop = el.scrollHeight;
    }
    lastCount.current = messages.length;
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function handleSend() {
    const body = text.trim();
    if (!body || sending || !info) return;
    setSending(true);
    setError(null);
    // Meteen in beeld; het echte bericht vervangt dit bij de volgende verversing.
    const tempId = `tmp-${Date.now()}`;
    stickToBottom.current = true;
    setMessages((m) => [
      ...m,
      { id: tempId, conversationId: id, senderId: info.me, kind: "text", body, adId: null, createdAt: new Date().toISOString(), reactions: [] },
    ]);
    setText("");
    try {
      const r = await sendMessage(id, "text", body);
      if (!r.ok) {
        setError(dmErrorLabel(r.reason));
        setMessages((m) => m.filter((x) => x.id !== tempId));
        setText(body);
      } else {
        await refreshMessages();
      }
    } catch {
      setError(dmErrorLabel());
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(body);
    } finally {
      setSending(false);
    }
  }

  async function handleReact(messageId: string, emoji: string) {
    if (messageId.startsWith("tmp-")) return;
    setPickerFor(null);
    setError(null);
    // Meteen zichtbaar: dezelfde emoji haalt weg, een andere vervangt.
    if (info) {
      setMessages((list) =>
        list.map((m) => {
          if (m.id !== messageId) return m;
          const mine = m.reactions.find((r) => r.consumerId === info.me);
          const others = m.reactions.filter((r) => r.consumerId !== info.me);
          return { ...m, reactions: mine?.emoji === emoji ? others : [...others, { consumerId: info.me, emoji }] };
        })
      );
    }
    try {
      const r = await reactToMessage(messageId, emoji);
      if (!r.ok) setError(dmErrorLabel(r.reason));
    } catch {
      setError(dmErrorLabel());
    }
    refreshMessages().catch(() => {});
  }

  async function handleBlockToggle() {
    if (!info) return;
    setMenuOpen(false);
    try {
      await setUserBlocked(info.other.id, !info.iBlocked);
      await refreshInfo();
    } catch {
      setError(dmErrorLabel());
    }
  }

  async function handleReport(reason: string) {
    if (!info) return;
    // Meld het laatste bericht van de ander (of de persoon zelf als er nog niets is).
    const target = [...messages].reverse().find((m) => m.senderId !== info.me && !m.id.startsWith("tmp-"));
    try {
      if (target) await reportMessage(info.me, target.id, reason);
      else await reportUser(info.me, info.other.id, reason);
      setReportDone(true);
    } catch {
      setError(dmErrorLabel());
      setReportOpen(false);
    }
  }

  const adById = useMemo(() => new Map(ads.map((a) => [a.id, a])), [ads]);

  if (!isLoggedIn && !authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm text-white/60">Log in om je berichten te lezen.</p>
        <button onClick={() => requireAuth()} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo">
          Inloggen
        </button>
      </div>
    );
  }

  if (missing) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm text-white/60">Dit gesprek bestaat niet (meer).</p>
        <Link href="/app/messages" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo">
          Naar je berichten
        </Link>
      </div>
    );
  }

  const canSend = !!info && !info.iBlocked && !info.blockedMe;

  return (
    <div className="flex h-full flex-col">
      <header className="z-30 flex shrink-0 items-center gap-3 border-b border-white/5 bg-indigo/90 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <button onClick={() => router.push("/app/messages")} aria-label="Terug" className="rounded-full p-1.5 hover:bg-white/10">
          <ChevronLeft size={22} />
        </button>
        {info && <UserAvatar src={info.other.avatarUrl} name={info.other.username} size={34} />}
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{info ? `@${info.other.username}` : " "}</p>
        <button onClick={() => setMenuOpen((o) => !o)} aria-label="Meer opties" className="rounded-full p-2 hover:bg-white/10">
          <MoreVertical size={18} />
        </button>
        {menuOpen && info && (
          <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+3.5rem)] z-40 w-52 overflow-hidden rounded-xl border border-white/10 bg-slate shadow-xl">
            <button onClick={handleBlockToggle} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm hover:bg-white/5">
              <Ban size={16} className="text-white/60" />
              {info.iBlocked ? "Deblokkeren" : "Blokkeren"}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setReportDone(false);
                setReportOpen(true);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm hover:bg-white/5"
            >
              <Flag size={16} className="text-white/60" />
              Rapporteren
            </button>
          </div>
        )}
      </header>

      <div ref={scrollRef} onScroll={handleScroll} onClick={() => menuOpen && setMenuOpen(false)} className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        {!loaded && <p className="py-10 text-center text-sm text-white/40">Laden...</p>}
        {loaded && messages.length === 0 && (
          <p className="py-16 text-center text-sm text-white/40">
            Zeg hoi{info ? ` tegen @${info.other.username}` : ""}. Stuur een video via het deel-icoon in de feed en verdien SWYP.
          </p>
        )}

        {messages.map((m, i) => {
          const mine = !!info && m.senderId === info.me;
          const prev = messages[i - 1];
          const showDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          const grouped = info ? groupReactions(m.reactions, info.me) : [];
          const myReaction = info ? m.reactions.find((r) => r.consumerId === info.me)?.emoji : undefined;
          const ad = m.adId ? adById.get(m.adId) : undefined;
          const product = ad ? products.find((p) => p.id === ad.productId) : undefined;
          const company = ad ? companies.find((c) => c.id === ad.companyId) : undefined;

          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wide text-white/30">{dayLabel(m.createdAt)}</p>}
              <div className={cn("mb-2 flex flex-col", mine ? "items-end" : "items-start")}>
                {m.kind === "video" ? (
                  <div className={cn("w-[190px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]", mine && "border-magenta/30")}>
                    {ad && company ? (
                      <Link href={`/app/company/${company.id}/videos?start=${ad.id}`} className="relative block aspect-[9/16] w-full">
                        <AdThumb posterUrl={ad.posterUrl} videoUrl={ad.videoUrl} fallbackImageUrl={product?.imageUrl} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                        <PlayCircle size={34} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/85" />
                        <div className="absolute inset-x-0 bottom-0 p-2.5">
                          <p className="text-[11px] font-semibold text-white/70">{company.name}</p>
                          <p className="line-clamp-2 text-xs font-medium">{ad.caption}</p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex aspect-[9/16] w-full items-center justify-center px-4 text-center text-xs text-white/40">
                        Deze video is niet meer beschikbaar.
                      </div>
                    )}
                    {m.body && <p className="px-3 pt-2 text-sm">{m.body}</p>}
                    <div className="flex items-center justify-between gap-1 px-2 py-2">
                      {VIDEO_RATING_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => handleReact(m.id, e)}
                          aria-label={`Reageer met ${e}`}
                          aria-pressed={myReaction === e}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-lg transition",
                            myReaction === e ? "bg-white/25 scale-110" : "hover:bg-white/10"
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setPickerFor((cur) => (cur === m.id ? null : m.id))}
                    className={cn(
                      "max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm",
                      mine ? "rounded-br-md bg-violet text-white" : "rounded-bl-md bg-white/10",
                      m.id.startsWith("tmp-") && "opacity-60"
                    )}
                  >
                    {m.body}
                  </button>
                )}

                {grouped.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {grouped.map((g) => (
                      <button
                        key={g.emoji}
                        onClick={() => handleReact(m.id, g.emoji)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                          g.mine ? "border-white/40 bg-white/15" : "border-white/10 bg-white/5"
                        )}
                      >
                        <span>{g.emoji}</span>
                        {g.count > 1 && <span className="tabular-nums text-white/70">{g.count}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {pickerFor === m.id && (
                  <div className="mt-1 flex items-center gap-0.5 rounded-full border border-white/10 bg-slate px-1.5 py-1 shadow-lg">
                    {REACTION_EMOJIS.map((e) => (
                      <button key={e} onClick={() => handleReact(m.id, e)} aria-label={`Reageer met ${e}`} className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-white/10">
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                <span className="mt-0.5 px-1 text-[10px] text-white/25">{formatTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="shrink-0 bg-red-500/10 px-4 py-1.5 text-center text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="shrink-0 border-t border-white/5 bg-indigo/90 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {info?.iBlocked ? (
          <div className="flex items-center justify-between gap-3 text-sm text-white/60">
            <span>Je hebt @{info.other.username} geblokkeerd.</span>
            <button onClick={handleBlockToggle} className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white">
              Deblokkeren
            </button>
          </div>
        ) : info?.blockedMe ? (
          <p className="text-center text-sm text-white/50">Je kunt deze persoon geen berichten sturen.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-1 items-center rounded-full border border-white/15 bg-white/5 pl-4 pr-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                placeholder="Typ een bericht..."
                disabled={!canSend}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/30"
              />
              <Smile size={18} className="text-white/25" aria-hidden />
            </div>
            <button
              type="submit"
              disabled={!canSend || !text.trim() || sending}
              aria-label="Versturen"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
        )}
      </div>

      {reportOpen && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/60" onClick={() => setReportOpen(false)}>
          <div className="w-full rounded-t-3xl border-t border-white/10 bg-slate p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-heading font-bold">{reportDone ? "Bedankt voor je melding" : "Waarom rapporteer je dit?"}</p>
              <button onClick={() => setReportOpen(false)} aria-label="Sluiten" className="rounded-full p-1.5 text-white/50 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            {reportDone ? (
              <p className="py-3 text-sm text-white/60">We bekijken dit zo snel mogelijk. Je kunt deze persoon ook blokkeren via het menu.</p>
            ) : (
              REPORT_REASONS.map((r) => (
                <button key={r.value} onClick={() => handleReport(r.value)} className="block w-full rounded-xl px-3 py-3 text-left text-sm hover:bg-white/5">
                  {r.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
