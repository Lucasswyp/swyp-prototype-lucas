import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { REACTION_EMOJIS, VIDEO_RATING_EMOJIS, dmErrorLabel, groupReactions, previewText } from "@/lib/dm";

const sql = readFileSync(new URL("../../supabase/dm.sql", import.meta.url), "utf8");

// De SQL schrijft emoji als Unicode-escapes (U&'\+01F44D'); dit zet een emoji
// uit de app om naar dezelfde schrijfwijze.
function toSqlEscape(emoji: string) {
  const cps = [...emoji].map((c) => c.codePointAt(0)!);
  return "U&'" + cps.map((cp) => (cp > 0xffff ? `\\+${cp.toString(16).toUpperCase().padStart(6, "0")}` : `\\${cp.toString(16).toUpperCase().padStart(4, "0")}`)).join("") + "'";
}

describe("emoji's", () => {
  it("elke emoji in de app staat ook in dm_react() in de database", () => {
    for (const e of REACTION_EMOJIS) expect(sql).toContain(toSqlEscape(e));
  });

  it("de database kent geen emoji die de app niet heeft", () => {
    const inSql = sql.match(/U&'[^']+'/g)?.length ?? 0;
    expect(inSql).toBe(REACTION_EMOJIS.length);
  });

  it("de snelle beoordelingsrij is een deel van de emoji-lijst", () => {
    for (const e of VIDEO_RATING_EMOJIS) expect(REACTION_EMOJIS).toContain(e);
  });
});

describe("groupReactions", () => {
  it("telt per emoji en weet welke van mij is", () => {
    const g = groupReactions(
      [
        { consumerId: "a", emoji: "🔥" },
        { consumerId: "b", emoji: "🔥" },
        { consumerId: "b", emoji: "😍" },
      ],
      "a"
    );
    expect(g).toEqual([
      { emoji: "🔥", count: 2, mine: true },
      { emoji: "😍", count: 1, mine: false },
    ]);
  });

  it("geeft een lege lijst zonder reacties", () => {
    expect(groupReactions([], "a")).toEqual([]);
  });
});

describe("previewText", () => {
  it("zet 'Jij:' voor eigen berichten", () => {
    expect(previewText({ lastKind: "text", lastBody: "hoi", lastSenderIsMe: true })).toBe("Jij: hoi");
    expect(previewText({ lastKind: "text", lastBody: "hoi", lastSenderIsMe: false })).toBe("hoi");
  });

  it("toont een video met optionele tekst", () => {
    expect(previewText({ lastKind: "video", lastBody: null, lastSenderIsMe: false })).toBe("🎬 Video");
    expect(previewText({ lastKind: "video", lastBody: "kijk", lastSenderIsMe: true })).toBe("Jij: 🎬 Video · kijk");
  });
});

describe("dmErrorLabel", () => {
  it("geeft een nette Nederlandse melding", () => {
    expect(dmErrorLabel("blocked")).toMatch(/geen berichten/);
    expect(dmErrorLabel("onbekend_iets")).toMatch(/misgegaan|mis/);
    expect(dmErrorLabel(undefined)).toMatch(/mis/);
  });
});
