// De lanceeranimatie speelt alleen bij een "koude start": de app is echt
// afgesloten geweest en wordt uren later opnieuw geopend. Niet bij verversen en
// niet bij even wegswipen en terugkomen.
//
// We onthouden het laatste moment dat de app actief was (localStorage, blijft
// bestaan na afsluiten) en of we deze sessie al een splash lieten zien
// (sessionStorage, verdwijnt als de app wordt afgesloten of ververst niet).

export const LAST_ACTIVE_KEY = "swyp-last-active";
export const SESSION_KEY = "swyp-splash-shown";
// Vanaf hoeveel stilte telt een nieuwe start als "koud".
export const COLD_START_AFTER_MS = 3 * 60 * 60 * 1000;

export function shouldPlaySplash(opts: {
  now: number;
  lastActive: number | null;
  shownThisSession: boolean;
}): boolean {
  if (opts.shownThisSession) return false;
  // Eerste keer ooit: ook een mooie start.
  if (opts.lastActive === null) return true;
  return opts.now - opts.lastActive >= COLD_START_AFTER_MS;
}

function readLastActive(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function markActive(now = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));
  } catch {
    /* privémodus of vol: geen splash-geheugen, dan geen splash */
  }
}

/**
 * Bepaalt bij het opstarten of de splash speelt. Roep één keer aan per
 * paginalading; een volgende aanroep in dezelfde sessie geeft false.
 */
export function consumeSplashDecision(now = Date.now()): boolean {
  let shown = false;
  try {
    shown = sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // Zonder sessionStorage kunnen we verversen niet herkennen: liever geen splash.
    return false;
  }
  const play = shouldPlaySplash({ now, lastActive: readLastActive(), shownThisSession: shown });
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* niets */
  }
  markActive(now);
  return play;
}
