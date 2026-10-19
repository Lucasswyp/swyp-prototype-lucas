"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUnreadTotal } from "@/lib/dm";

// Aantal ongelezen berichten voor het bolletje in de navigatie. Haalt het
// opnieuw op bij een nieuw bericht (realtime), elke 20 seconden en als de app
// weer in beeld komt.
export function useUnreadDms(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const n = await fetchUnreadTotal();
        if (!cancelled) setCount(n);
      } catch {
        // Een mislukte poging laat het oude getal staan.
      }
    };
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("swyp-dm-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    const interval = window.setInterval(load, 20000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("swyp-dm-read", load);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("swyp-dm-read", load);
    };
  }, [enabled]);

  return enabled ? count : 0;
}
