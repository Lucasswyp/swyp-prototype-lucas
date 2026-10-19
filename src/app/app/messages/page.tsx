"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PenSquare, MessageCircle } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { Button } from "@/components/ui/Button";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { createClient } from "@/lib/supabase/client";
import { fetchConversations, previewText, type ConversationSummary } from "@/lib/dm";

export default function MessagesPage() {
  const { isLoggedIn, loading: authLoading, requireAuth } = useConsumerAuth();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await fetchConversations();
        if (!cancelled) {
          setConversations(list);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("swyp-dm-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    const interval = window.setInterval(load, 8000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoggedIn]);

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Berichten" />

      {!isLoggedIn && !authLoading ? (
        <EmptyState
          icon={MessageCircle}
          title="Praat met je vrienden"
          description="Log in om video's door te sturen, te chatten en punten te verdienen."
          action={<Button onClick={() => requireAuth()}>Inloggen</Button>}
        />
      ) : (
        <>
          <div className="px-4 pb-3">
            <Link
              href="/app/messages/new"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold"
            >
              <PenSquare size={16} /> Nieuw bericht
            </Link>
          </div>

          {failed && !conversations && <p className="px-6 py-10 text-center text-sm text-white/50">Laden is mislukt. Probeer het zo opnieuw.</p>}

          {conversations && conversations.length === 0 && (
            <EmptyState
              icon={MessageCircle}
              title="Nog geen berichten"
              description="Stuur een video naar een vriend via het deel-icoon in de feed, of begin hierboven een gesprek. Doorsturen levert SWYP op."
            />
          )}

          <ul className="px-2">
            {conversations?.map((c) => (
              <li key={c.conversationId}>
                <Link
                  href={`/app/messages/${c.conversationId}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/5"
                >
                  <UserAvatar src={c.other.avatarUrl} name={c.other.username} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${c.unreadCount > 0 ? "font-bold" : "font-semibold"}`}>@{c.other.username}</p>
                      <span className="shrink-0 text-[11px] text-white/35">
                        <TimeAgo iso={c.lastMessageAt} />
                      </span>
                    </div>
                    <p className={`truncate text-sm ${c.unreadCount > 0 ? "text-white" : "text-white/50"}`}>{previewText(c)}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="min-w-[20px] rounded-full bg-magenta px-1.5 text-center text-[11px] font-bold leading-5 text-white">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
