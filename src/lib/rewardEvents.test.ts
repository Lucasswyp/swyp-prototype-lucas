import { describe, expect, it, vi } from "vitest";
import { announceAward, emitReward, onReward, rewardEventFromAward } from "@/lib/rewardEvents";

describe("rewardEventFromAward", () => {
  it("maakt een event van een toegekende beloning", () => {
    expect(rewardEventFromAward("like", { awarded: true, points: 4 })).toEqual({ kind: "like", points: 4, streakBonus: 0 });
  });

  it("neemt de streakbonus mee", () => {
    expect(rewardEventFromAward("watch", { awarded: true, points: 15, streakBonus: 30 })).toEqual({ kind: "watch", points: 15, streakBonus: 30 });
  });

  it("viert een streakbonus ook als de beloning zelf al eerder was uitgekeerd", () => {
    expect(rewardEventFromAward("watch", { awarded: false, reason: "already_awarded", streakBonus: 5 })).toEqual({ kind: "watch", points: 0, streakBonus: 5 });
  });

  it("geeft niets terug als er niets te vieren is", () => {
    expect(rewardEventFromAward("like", { awarded: false, reason: "already_awarded" })).toBeNull();
    expect(rewardEventFromAward("like", { awarded: true, points: 0 })).toBeNull();
    expect(rewardEventFromAward("like", null)).toBeNull();
    expect(rewardEventFromAward("like", undefined)).toBeNull();
  });
});

describe("omroep", () => {
  it("geeft een event door aan wie luistert en stopt na afmelden", () => {
    const fn = vi.fn();
    const off = onReward(fn);
    announceAward("save", { awarded: true, points: 8 });
    expect(fn).toHaveBeenCalledWith({ kind: "save", points: 8, streakBonus: 0 });
    off();
    emitReward({ kind: "like", points: 4, streakBonus: 0 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("meldt niets bij een beloning die niet is toegekend", () => {
    const fn = vi.fn();
    const off = onReward(fn);
    announceAward("click", { awarded: false, reason: "daily_cap" });
    expect(fn).not.toHaveBeenCalled();
    off();
  });
});
