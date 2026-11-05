import { FIXED_REWARDS } from "@/lib/data";

// Wat een token waard is en hoe je er een verdient. Haalt de aantallen uit dezelfde plek als de
// campagnes, zodat uitleg en beloning niet uit elkaar lopen.
export const TOKEN_VALUE_EUR = 0.01;

export const EARN_LINES: { label: string; tokens: number }[] = [
  { label: "Een video tot het eind kijken", tokens: FIXED_REWARDS.watch80 },
  { label: "Doorklikken naar het bedrijf", tokens: FIXED_REWARDS.click },
  { label: "Een video bewaren", tokens: FIXED_REWARDS.save },
  { label: "Een video liken", tokens: FIXED_REWARDS.like },
];

export function tokensToEuro(tokens: number): string {
  return `€${(tokens * TOKEN_VALUE_EUR).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
