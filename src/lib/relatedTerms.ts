import { RELATED_TERMS_RAW } from "@/lib/relatedTermsData";

interface TermGroup {
  category: string;
  terms: string[];
}

export interface RelatedResult {
  terms: string[];
  categories: string[];
}

const MAX_GROUPS = 3;
const MAX_TERMS = 30;
const MAX_QUERY_CHARS = 400;

// Categorieën die inhoudelijk bij elkaar horen: wie op "pizza" zoekt (Food) wil
// ook video's van restaurants zien, en andersom.
const SIBLING_CATEGORIES: Record<string, string[]> = {
  Food: ["Restaurants"],
  Restaurants: ["Food"],
  Fitness: ["Wellness"],
  Wellness: ["Fitness", "Beauty"],
  Fashion: ["Beauty"],
  Beauty: ["Fashion", "Wellness"],
  Tech: ["Gaming"],
  Gaming: ["Tech"],
  Travel: ["Events"],
  Events: ["Travel"],
  Home: [],
  Cars: [],
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9&'+\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let groups: TermGroup[] | null = null;
let exact: Map<string, number[]> | null = null;
let normalizedTerms: string[][] | null = null;

function build() {
  if (groups && exact && normalizedTerms) return;
  const g: TermGroup[] = [];
  const idx = new Map<string, number[]>();
  const norm: string[][] = [];
  for (const line of RELATED_TERMS_RAW.split("\n")) {
    const bar = line.indexOf("|");
    if (bar === -1) continue;
    const category = line.slice(0, bar).trim();
    const terms = line
      .slice(bar + 1)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!category || terms.length === 0) continue;
    const gi = g.length;
    g.push({ category, terms });
    const normed = terms.map(normalize);
    norm.push(normed);
    for (const t of new Set(normed)) {
      const list = idx.get(t);
      if (list) list.push(gi);
      else idx.set(t, [gi]);
    }
  }
  groups = g;
  exact = idx;
  normalizedTerms = norm;
}

function stems(token: string) {
  const out = [token];
  if (token.length > 4 && token.endsWith("en")) out.push(token.slice(0, -2));
  if (token.length > 3 && token.endsWith("s")) out.push(token.slice(0, -1));
  if (token.length > 4 && token.endsWith("es")) out.push(token.slice(0, -2));
  return out;
}

// Geeft woorden terug die bij de zoekterm passen, plus de categorieën van de
// groepen waar hij in zat. Leeg als de zoekterm nergens in voorkomt.
export function getRelatedTerms(rawQuery: string): RelatedResult {
  build();
  const q = normalize(rawQuery);
  if (!q) return { terms: [], categories: [] };

  const score = new Map<number, number>();
  const bump = (list: number[] | undefined, by: number) => {
    if (!list) return;
    for (const gi of list) score.set(gi, (score.get(gi) ?? 0) + by);
  };

  const tokens = q.split(" ").filter((t) => t.length >= 3);
  for (const s of stems(q)) bump(exact!.get(s), 10);
  for (const token of tokens) for (const s of stems(token)) bump(exact!.get(s), 3);

  // Nog niets gevonden: de gebruiker is misschien nog aan het typen
  // ("adid" voor "adidas"), dus kijk naar termen die zo beginnen.
  if (score.size === 0) {
    const last = tokens[tokens.length - 1] ?? (q.length >= 3 ? q : "");
    if (last) {
      for (const [term, list] of exact!) {
        if (term.startsWith(last)) bump(list, 1);
      }
    }
  }
  if (score.size === 0) return { terms: [], categories: [] };

  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, MAX_GROUPS);
  const queryWords = new Set([q, ...q.split(" ")]);
  const seen = new Set<string>();
  const terms: string[] = [];
  const categories: string[] = [];
  let chars = 0;

  // Per groep om de beurt een term nemen, zodat de sterkste groep niet alles opeet.
  const cursors = ranked.map(() => 0);
  let progressed = true;
  while (progressed && terms.length < MAX_TERMS && chars < MAX_QUERY_CHARS) {
    progressed = false;
    for (let r = 0; r < ranked.length; r++) {
      const gi = ranked[r][0];
      const list = normalizedTerms![gi];
      while (cursors[r] < list.length) {
        const t = list[cursors[r]++];
        if (!t || queryWords.has(t) || seen.has(t)) continue;
        seen.add(t);
        terms.push(t);
        chars += t.length + 1;
        progressed = true;
        break;
      }
      if (terms.length >= MAX_TERMS || chars >= MAX_QUERY_CHARS) break;
    }
  }
  for (const [gi] of ranked) {
    const c = groups![gi].category;
    if (!categories.includes(c)) categories.push(c);
  }
  for (const c of [...categories]) {
    for (const sibling of SIBLING_CATEGORIES[c] ?? []) {
      if (!categories.includes(sibling)) categories.push(sibling);
    }
  }
  return { terms, categories };
}

export function relatedTermCount() {
  build();
  const all = new Set<string>();
  for (const list of normalizedTerms!) for (const t of list) all.add(t);
  return all.size;
}
