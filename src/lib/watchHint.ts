// Een kleine aanwijzing op de video: "Kijk tot het eind: +15". Alleen de eerste paar video's die
// iemand op dit apparaat ziet; daarna kent die het wel.
export const WATCH_HINT_MAX_VIDEOS = 6;
const KEY = "swyp_watch_hint_seen";

export function shouldShowWatchHint(seen: number): boolean {
  return seen < WATCH_HINT_MAX_VIDEOS;
}

export function readWatchHintSeen(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function bumpWatchHintSeen() {
  try {
    localStorage.setItem(KEY, String(readWatchHintSeen() + 1));
  } catch {}
}

/** Voortgang naar het doel (80% van de video) als getal van 0 tot 100. */
export function watchGoalProgress(pct: number): number {
  return Math.max(0, Math.min(100, Math.round((pct / 80) * 100)));
}
