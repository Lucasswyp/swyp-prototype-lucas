import { describe, expect, it } from "vitest";
import { EARN_LINES, tokensToEuro } from "@/lib/tokenInfo";
import { FIXED_REWARDS } from "@/lib/data";

describe("tokenInfo", () => {
  it("toont dezelfde aantallen als de vaste beloningen", () => {
    const byLabel = Object.fromEntries(EARN_LINES.map((l) => [l.label, l.tokens]));
    expect(byLabel["Een video tot het eind kijken"]).toBe(FIXED_REWARDS.watch80);
    expect(byLabel["Een video liken"]).toBe(FIXED_REWARDS.like);
    expect(byLabel["Een video bewaren"]).toBe(FIXED_REWARDS.save);
    expect(byLabel["Doorklikken naar het bedrijf"]).toBe(FIXED_REWARDS.click);
  });

  it("rekent tokens om met 1 token = 1 cent", () => {
    expect(tokensToEuro(100)).toBe("€1,00");
    expect(tokensToEuro(15)).toBe("€0,15");
  });
});
