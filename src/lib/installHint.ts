// "Zet Swyp op je beginscherm": een iPhone toont daar geen eigen melding voor, dus vertellen we
// het zelf, één keer en zonder te zeuren.

export const INSTALL_HINT_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const KEY = "swyp_install_hint_snoozed_at";

export interface Env {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  standalone: boolean;
}

/** Een iPhone of iPad (ook een iPad die zich als Mac meldt). */
export function isIos(env: Pick<Env, "userAgent" | "platform" | "maxTouchPoints">): boolean {
  return /iPhone|iPad|iPod/.test(env.userAgent) || (env.platform === "MacIntel" && env.maxTouchPoints > 1);
}

// Browsers binnen andere apps (Instagram, Facebook, TikTok, ...) hebben geen "Zet op beginscherm".
const IN_APP_BROWSER = /FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat|Twitter|LinkedInApp|MicrosoftEdge|GSA\//;

/** Echte Safari (of Chrome) op iOS, waar het deelmenu "Zet op beginscherm" heeft. */
export function canAddToHomeScreenOnIos(env: Env): boolean {
  if (!isIos(env) || env.standalone) return false;
  if (IN_APP_BROWSER.test(env.userAgent)) return false;
  // De iPhone-app (een WebView) heeft geen "Safari/" in zijn UA; daar is dit niet van toepassing.
  return /Safari\//.test(env.userAgent);
}

export function shouldShowInstallHint(env: Env, snoozedAt: number | null, now: number): boolean {
  if (!canAddToHomeScreenOnIos(env)) return false;
  if (snoozedAt !== null && now - snoozedAt < INSTALL_HINT_SNOOZE_MS) return false;
  return true;
}

export function readEnv(): Env {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    standalone: nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
  };
}

export function readSnooze(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export function snoozeInstallHint(now: number) {
  try {
    localStorage.setItem(KEY, String(now));
  } catch {}
}
