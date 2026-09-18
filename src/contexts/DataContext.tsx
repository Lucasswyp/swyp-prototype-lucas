"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAll } from "@/lib/data";
import type { Company, Product, Ad, Campaign, Reward } from "@/types";

interface DataState {
  companies: Company[];
  products: Product[];
  ads: Ad[];
  campaigns: Campaign[];
  rewards: Reward[];
  loading: boolean;
  refresh: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<DataState, "refresh">>({
    companies: [],
    products: [],
    ads: [],
    campaigns: [],
    rewards: [],
    loading: true,
  });
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const data = await fetchAll();
    setState((s) => ({ ...s, ...data, loading: false }));
  }, []);

  const refresh = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(load, 400);
  }, [load]);

  useEffect(() => {
    // Initial fetch-on-mount: load() awaits the network call before touching
    // state, so this isn't a synchronous render-time state write.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("swyp-data-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "ads" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "rewards" }, refresh)
      .subscribe();

    // Realtime needs the tables added to the supabase_realtime publication;
    // poll as a robust fallback either way so data never goes stale for long.
    const interval = window.setInterval(load, 20000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [load, refresh]);

  return <DataContext.Provider value={{ ...state, refresh }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
