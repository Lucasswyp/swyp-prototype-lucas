"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import { X, Search as SearchIcon, Link2, Check, Send } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useWallet } from "@/contexts/WalletContext";
import {
  SHARE_POINTS,
  dmErrorLabel,
  fetchConversations,
  notifyRecipient,
  getOrCreateConversation,
  searchConsumers,
  sendMessage,
  type ConversationSummary,
  type DmUser,
} from "@/lib/dm";
import { shareLink } from "@/lib/share";
import { announceAward } from "@/lib/rewardEvents";

type RowState = "idle" | "sending" | "sent";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  adId: string;
  productName: string;
  /** Link voor "Link delen" onderaan (de productpagina). */
  linkUrl: string;
  /** Laat de feed een korte melding zien, zoals "+12 SWYP". */
  onNotify: (label: string) => void;
}

// "Delen": stuur de video rechtstreeks naar iemand op Swyp (levert punten op),
// of deel de link buiten de app.
export function ShareSheet({ open, onClose, adId, productName, linkUrl, onNotify }: ShareSheetProps) {
  const { syncBalance } = useWallet();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<ConversationSummary[]>([]);
  const [results, setResults] = useState<DmUser[]>([]);
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const sendingRef = useRef<Set<string>>(new Set());

  // Bij openen: recente gesprekken laden en alles terugzetten.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Elke keer dat het venster opengaat begint het leeg: een reset op een
    // externe gebeurtenis (openen), geen afgeleide waarde.
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery("");
    setResults([]);
    setNote("");
    setRows({});
    setError(null);
    setCopied(false);
    setReward(null);
    sendingRef.current = new Set();
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchConversations()
      .then((c) => !cancelled && setRecent(c.slice(0, 6)))
      .catch(() => !cancelled && setRecent([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim().replace(/^@/, "");
    if (q.length < 2) {
      // Zoekveld leeggemaakt: een externe reset van de resultaten.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = window.setTimeout(async () => {
      try {
        const found = await searchConsumers(q);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  async function sendTo(user: DmUser, existingConversationId?: string) {
    if (sendingRef.current.has(user.id)) return;
    sendingRef.current.add(user.id);
    setError(null);
    setRows((r) => ({ ...r, [user.id]: "sending" }));
    try {
      let conversationId = existingConversationId;
      if (!conversationId) {
        const created = await getOrCreateConversation(user.id);
        if (!created.ok || !created.conversationId) {
          setError(dmErrorLabel(created.reason));
          setRows((r) => ({ ...r, [user.id]: "idle" }));
          return;
        }
        conversationId = created.conversationId;
      }
      const result = await sendMessage(conversationId, "video", note.trim() || null, adId);
      if (!result.ok) {
        setError(dmErrorLabel(result.reason));
        setRows((r) => ({ ...r, [user.id]: "idle" }));
        return;
      }
      setRows((r) => ({ ...r, [user.id]: "sent" }));
      notifyRecipient(result.messageId);
      announceAward("share", { awarded: !!result.awarded, points: result.points });
      syncBalance(result.balance);
      posthog.capture("video_shared_dm", { adId, awarded: result.awarded, points: result.points ?? 0, reason: result.awardReason });
      if (result.awarded) {
        const label = `+${result.points ?? SHARE_POINTS} SWYP voor doorsturen`;
        setReward(label);
        onNotify(label);
      } else {
        setReward(
          result.awardReason === "already_awarded"
            ? "Verstuurd. Voor deze video heb je al punten gehad."
            : result.awardReason === "daily_cap"
              ? "Verstuurd. Je hebt vandaag al 5 keer punten gekregen voor doorsturen."
              : "Verstuurd."
        );
      }
    } catch {
      setError(dmErrorLabel());
      setRows((r) => ({ ...r, [user.id]: "idle" }));
    } finally {
      sendingRef.current.delete(user.id);
    }
  }

  async function handleLink() {
    const result = await shareLink(linkUrl, `Bekijk ${productName} op Swyp`);
    if (result === "copied") {
      setCopied(true);
      onNotify("Link gekopieerd naar klembord");
    }
  }

  const showingSearch = query.trim().replace(/^@/, "").length >= 2;
  const list: { user: DmUser; conversationId?: string }[] = showingSearch
    ? results.map((user) => ({ user }))
    : recent.map((c) => ({ user: c.other, conversationId: c.conversationId }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[55] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0 bg-black/60" aria-label="Sluiten" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex max-h-[78%] w-full flex-col rounded-t-3xl border-t border-white/10 bg-slate px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
            role="dialog"
            aria-label="Delen"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-base font-bold">Stuur naar een vriend</h2>
              <button onClick={onClose} aria-label="Sluiten" className="rounded-full p-1.5 text-white/50 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <p className="mb-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
              Je krijgt <span className="font-semibold text-white">+{SHARE_POINTS} SWYP</span> voor elke nieuwe video die je doorstuurt (max 5 per dag).
            </p>

            {reward && (
              <p role="status" className="mb-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300">
                {reward}
              </p>
            )}

            <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
              <SearchIcon size={16} className="text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek op gebruikersnaam"
                autoCapitalize="none"
                autoCorrect="off"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Bericht erbij (optioneel)"
              className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/30"
            />

            <div className="min-h-[96px] flex-1 overflow-y-auto no-scrollbar">
              {!showingSearch && list.length > 0 && (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">Recent</p>
              )}
              {list.map(({ user, conversationId }) => {
                const state = rows[user.id] ?? "idle";
                return (
                  <div key={user.id} className="flex items-center gap-3 py-2">
                    <UserAvatar src={user.avatarUrl} name={user.username} size={40} />
                    <p className="flex-1 truncate text-sm font-medium">@{user.username}</p>
                    <button
                      onClick={() => sendTo(user, conversationId)}
                      disabled={state !== "idle"}
                      className={`flex min-w-[78px] items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                        state === "sent" ? "bg-emerald-500/20 text-emerald-300" : "bg-white text-indigo disabled:opacity-60"
                      }`}
                    >
                      {state === "sent" ? (
                        <>
                          <Check size={14} /> Gestuurd
                        </>
                      ) : state === "sending" ? (
                        "..."
                      ) : (
                        <>
                          <Send size={13} /> Stuur
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
              {showingSearch && !searching && list.length === 0 && (
                <p className="py-6 text-center text-sm text-white/40">Niemand gevonden met deze naam.</p>
              )}
              {!showingSearch && list.length === 0 && (
                <p className="py-6 text-center text-sm text-white/40">Zoek hierboven op de gebruikersnaam van een vriend.</p>
              )}
            </div>

            {error && <p role="alert" className="mt-2 text-center text-xs text-red-300">{error}</p>}

            <button
              onClick={handleLink}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/80"
            >
              {copied ? <Check size={16} /> : <Link2 size={16} />}
              Link delen buiten Swyp
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
