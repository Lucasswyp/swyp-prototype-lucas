// De feed onthouden: volgorde en welke video je bekeek. Komt de app (of de pagina) binnen een
// halfuur terug, dan sta je weer precies waar je was. Daarna begint de feed opnieuw.
import { APP_RESUME_REFRESH_MS } from "@/lib/appVisibility";

const KEY = "swyp-feed-state";

export interface SavedFeed {
  ids: string[];
  activeId: string | null;
}

export function saveFeedState(ids: string[], activeId: string | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), ids: ids.slice(0, 200), activeId }));
  } catch {
    /* privémodus of vol: dan begint de feed gewoon opnieuw */
  }
}

export function clearFeedState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* niets */
  }
}

export function isFeedStateFresh(ts: number, now = Date.now()) {
  return Number.isFinite(ts) && now - ts < APP_RESUME_REFRESH_MS;
}

export function loadFeedState(now = Date.now()): SavedFeed | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { ts?: number; ids?: unknown; activeId?: unknown };
    if (typeof data.ts !== "number" || !isFeedStateFresh(data.ts, now)) return null;
    if (!Array.isArray(data.ids) || !data.ids.every((x) => typeof x === "string")) return null;
    return { ids: data.ids as string[], activeId: typeof data.activeId === "string" ? data.activeId : null };
  } catch {
    return null;
  }
}
