"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { dmErrorLabel, getOrCreateConversation, searchConsumers, type DmUser } from "@/lib/dm";

export default function NewMessagePage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, requireAuth } = useConsumerAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DmUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = q.trim().replace(/^@/, "");

  useEffect(() => {
    if (query.length < 2) {
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
        const found = await searchConsumers(query);
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

  async function open(user: DmUser) {
    if (opening) return;
    setOpening(user.id);
    setError(null);
    try {
      const r = await getOrCreateConversation(user.id);
      if (r.ok && r.conversationId) {
        router.push(`/app/messages/${r.conversationId}`);
        return;
      }
      setError(dmErrorLabel(r.reason));
    } catch {
      setError(dmErrorLabel());
    }
    setOpening(null);
  }

  if (!isLoggedIn && !authLoading) {
    return (
      <div className="min-h-full pb-28">
        <TopBar back title="Nieuw bericht" />
        <EmptyState
          icon={SearchIcon}
          title="Log eerst in"
          description="Om berichten te sturen heb je een account nodig."
          action={<Button onClick={() => requireAuth()}>Inloggen</Button>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28">
      <TopBar back title="Nieuw bericht" />
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
          <SearchIcon size={18} className="text-white/40" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op gebruikersnaam"
            autoCapitalize="none"
            autoCorrect="off"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Wissen">
              <X size={16} className="text-white/40" />
            </button>
          )}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
      </div>

      {query.length < 2 && <p className="px-6 py-8 text-center text-sm text-white/40">Typ minstens 2 letters van de gebruikersnaam.</p>}
      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="px-6 py-8 text-center text-sm text-white/40">Niemand gevonden met &ldquo;{query}&rdquo;.</p>
      )}

      <ul className="px-2">
        {results.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => open(u)}
              disabled={opening !== null}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-white/5 disabled:opacity-60"
            >
              <UserAvatar src={u.avatarUrl} name={u.username} size={44} />
              <span className="text-sm font-semibold">@{u.username}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
