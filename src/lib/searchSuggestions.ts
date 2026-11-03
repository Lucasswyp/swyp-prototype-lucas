import { dictionaryTerms, normalizeSearchText } from "@/lib/relatedTerms";

// Aanvullen tijdens het typen. Typ je "n", dan komen er voorstellen als "nike" of "nieuwe collectie";
// typ je meer letters, dan blijven er steeds minder, en preciezere, over.
//
// Volgorde:
//  1. Wat echt in Swyp staat (namen van bedrijven en producten) en met jouw letters begint.
//  2. Woorden uit het woordenboek die ermee beginnen, de belangrijkste eerst.
//  3. Voorstellen waarbij een later woord ermee begint ("schoenen" bij "sch" in "nieuwe schoenen").
//  4. Pas vanaf drie letters: termen waar jouw tekst ergens in voorkomt.

export interface Suggestion {
  text: string;
  /** Kort label, bijvoorbeeld "Bedrijf" of "Product". Leeg voor gewone zoekwoorden. */
  kind?: "bedrijf" | "product";
}

export interface SuggestionSource {
  text: string;
  kind: "bedrijf" | "product";
}

// Zinnen zoals mensen echt zoeken: een bijvoeglijk woord met iets om te kopen.
const MODIFIERS = ["nieuwe", "goedkope", "beste", "leuke"];
const THINGS = [
  "schoenen", "sneakers", "kleding", "jas", "tas", "bril", "horloge", "telefoon", "laptop", "koptelefoon",
  "parfum", "make-up", "koffie", "restaurant", "sportschool", "kapper", "fiets", "meubels",
];
const GIFTS = ["cadeau voor hem", "cadeau voor haar", "cadeau voor mama", "cadeau voor papa", "cadeau voor vriend", "cadeau voor vriendin"];

function phraseList() {
  const out: { text: string; norm: string }[] = [];
  const add = (text: string) => out.push({ text, norm: normalizeSearchText(text) });
  for (const t of THINGS) for (const m of MODIFIERS) add(`${m} ${t}`);
  for (const g of GIFTS) add(g);
  return out;
}
const PHRASES = phraseList();

export function getSuggestions(prefix: string, content: SuggestionSource[], limit = 8): Suggestion[] {
  const q = normalizeSearchText(prefix);
  if (!q) return [];

  type Item = { suggestion: Suggestion; weight: number; length: number };
  const seen = new Set<string>();
  const wordStart = (norm: string) => norm.split(" ").some((w, i) => i > 0 && w.startsWith(q));
  const sorter = (a: Item, b: Item) =>
    a.weight - b.weight || a.length - b.length || a.suggestion.text.localeCompare(b.suggestion.text);
  const take = (list: Item[], norm: string, suggestion: Suggestion, weight: number) => {
    if (norm === q || seen.has(norm)) return; // precies wat je typt hoeft niet nog eens voorgesteld te worden
    seen.add(norm);
    list.push({ suggestion, weight, length: norm.length });
  };

  const real: Item[] = [];
  const realLater: Item[] = [];
  const words: Item[] = [];
  const phrases: Item[] = [];
  const wordsLater: Item[] = [];
  const phrasesLater: Item[] = [];
  const contains: Item[] = [];

  for (const c of content) {
    const norm = normalizeSearchText(c.text);
    if (!norm) continue;
    if (norm.startsWith(q)) take(real, norm, { text: c.text, kind: c.kind }, 0);
    else if (wordStart(norm)) take(realLater, norm, { text: c.text, kind: c.kind }, 0);
  }
  PHRASES.forEach((ph, i) => {
    if (ph.norm.startsWith(q)) take(phrases, ph.norm, { text: ph.text }, i);
    else if (wordStart(ph.norm)) take(phrasesLater, ph.norm, { text: ph.text }, i);
  });
  for (const t of dictionaryTerms()) {
    if (t.norm.startsWith(q)) take(words, t.norm, { text: t.text }, t.weight);
    else if (wordStart(t.norm)) take(wordsLater, t.norm, { text: t.text }, t.weight);
    else if (q.length >= 3 && t.norm.includes(q)) take(contains, t.norm, { text: t.text }, t.weight);
  }

  // Eerst wat echt in Swyp staat, dan om de beurt een zoekwoord en een zin, zodat je zowel "nike" als
  // "nieuwe schoenen" ziet bij een "n". Daarna pas de minder directe voorstellen.
  const out: Suggestion[] = [];
  const take3 = (list: Item[], max: number) => {
    list.sort(sorter);
    for (const item of list.slice(0, max)) if (out.length < limit) out.push(item.suggestion);
  };
  take3(real, 3);
  const queues = [words.sort(sorter), phrases.sort(sorter)];
  const cursors = [0, 0];
  while (out.length < limit && (cursors[0] < queues[0].length || cursors[1] < queues[1].length)) {
    for (let k = 0; k < 2 && out.length < limit; k++) {
      if (cursors[k] < queues[k].length) out.push(queues[k][cursors[k]++].suggestion);
    }
  }
  for (const list of [real.slice(3), realLater, wordsLater, phrasesLater, contains]) take3(list, limit);
  return out.slice(0, limit);
}

// Recente zoekopdrachten: alleen op dit apparaat.
const RECENT_KEY = "swyp-recent-searches";
const MAX_RECENT = 6;

export function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(query: string) {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const rest = loadRecentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...rest].slice(0, MAX_RECENT)));
  } catch {
    /* privémodus: dan geen recente zoekopdrachten */
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* niets */
  }
}
