"use client";

import { useCallback, useSyncExternalStore } from "react";

// Twee ontwerpen voor de knoppen rechts in de feed:
//   "a" = losse ronde knoppen (het oorspronkelijke ontwerp)
//   "b" = één glazen kapsel met labels (de standaard sinds 2026-11-01)
// De keuze staat in de browser (localStorage). Met ?knoppen=a of ?knoppen=b in
// het adres kun je meteen wisselen om te vergelijken; dat wordt onthouden.
export type FeedButtonStyle = "a" | "b";
export const DEFAULT_BUTTON_STYLE: FeedButtonStyle = "b";

const KEY = "swyp-feed-button-style";
const EVENT = "swyp-feed-button-style-change";

export function parseButtonStyle(value: string | null | undefined): FeedButtonStyle | null {
  const v = (value ?? "").trim().toLowerCase();
  return v === "a" || v === "b" ? v : null;
}

function read(): FeedButtonStyle {
  try {
    const fromUrl = parseButtonStyle(new URLSearchParams(window.location.search).get("knoppen"));
    if (fromUrl) {
      window.localStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    return parseButtonStyle(window.localStorage.getItem(KEY)) ?? DEFAULT_BUTTON_STYLE;
  } catch {
    return DEFAULT_BUTTON_STYLE;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useFeedButtonStyle(): [FeedButtonStyle, (next: FeedButtonStyle) => void] {
  const style = useSyncExternalStore(subscribe, read, () => DEFAULT_BUTTON_STYLE);
  const setStyle = useCallback((next: FeedButtonStyle) => {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Geen opslag beschikbaar (privévenster): de keuze geldt dan niet voor later.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [style, setStyle];
}
