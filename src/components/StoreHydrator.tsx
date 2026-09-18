"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

// The store is created with `skipHydration: true` so the server render and
// the client's first render both use the same fresh baseState (no
// localStorage on the server) — this avoids hydration mismatches. Once
// mounted, we rehydrate from localStorage, which then flows through as a
// normal client-side state update rather than a hydration diff.
export function StoreHydrator() {
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  return null;
}
