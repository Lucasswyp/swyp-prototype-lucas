import type { AwardResult } from "@/lib/rewards";

// Een kleine "er zijn punten verdiend"-omroep. Alles wat punten oplevert
// (kijken, liken, opslaan, doorklikken, product bekijken, volgen, doorsturen)
// meldt dat hier, en de animatielaag (RewardFxLayer) laat er een feestje van
// zien. Zo hoeft geen enkel scherm zelf iets te animeren.
export type RewardKind = "watch" | "like" | "save" | "view" | "click" | "follow" | "share";

export interface RewardEvent {
  kind: RewardKind;
  points: number;
  streakBonus: number;
}

type Listener = (event: RewardEvent) => void;
const listeners = new Set<Listener>();

export function onReward(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitReward(event: RewardEvent) {
  for (const l of [...listeners]) l(event);
}

// Maakt van het antwoord van de server een event, of niets als er niets te vieren is.
// Een streakbonus telt ook mee, zelfs als de beloning zelf al eerder was uitgekeerd.
export function rewardEventFromAward(kind: RewardKind, result: AwardResult | null | undefined): RewardEvent | null {
  if (!result) return null;
  const points = result.awarded && typeof result.points === "number" ? result.points : 0;
  const streakBonus = typeof result.streakBonus === "number" ? result.streakBonus : 0;
  if (points <= 0 && streakBonus <= 0) return null;
  return { kind, points, streakBonus };
}

export function announceAward(kind: RewardKind, result: AwardResult | null | undefined) {
  const event = rewardEventFromAward(kind, result);
  if (event) emitReward(event);
}
