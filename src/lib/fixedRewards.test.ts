import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIXED_REWARDS } from "@/lib/data";

const sql = readFileSync(new URL("../../supabase/fixed_rewards_and_cta_color.sql", import.meta.url), "utf8");

// De app en de database moeten dezelfde vaste beloningen kennen.
describe("vaste beloningen", () => {
  it("de database dwingt dezelfde waarden af als de app toont", () => {
    expect(sql).toContain(`new.reward_watch := ${FIXED_REWARDS.watch80};`);
    expect(sql).toContain(`new.reward_like := ${FIXED_REWARDS.like};`);
    expect(sql).toContain(`new.reward_save := ${FIXED_REWARDS.save};`);
    expect(sql).toContain(`new.reward_click := ${FIXED_REWARDS.click};`);
  });

  it("de knopkleur is in de database beperkt tot een hexkleur", () => {
    expect(sql).toContain("'^#[0-9A-Fa-f]{6}$'");
  });
});
