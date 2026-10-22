export const MIN_TOP_UP = 5;
export const MAX_TOP_UP = 10000;
const EXTEND_DAYS = 30;

export interface TopUpPlan {
  totalBudget: number;
  /** YYYY-MM-DD; alleen aangepast als de campagne al was afgelopen. */
  endDate: string;
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Bijvullen: het nieuwe totaalbudget is wat al besteed is (of het oude budget
// als dat hoger was) plus het extra bedrag. Was de einddatum voorbij, dan
// loopt de campagne weer 30 dagen vanaf vandaag, anders zou hij meteen weer stoppen.
export function planTopUp(
  campaign: { totalBudget: number; endDate: string },
  spent: number,
  extra: number,
  today: string
): TopUpPlan | { error: string } {
  if (!Number.isFinite(extra) || extra < MIN_TOP_UP) return { error: `Vul minstens €${MIN_TOP_UP} in.` };
  if (extra > MAX_TOP_UP) return { error: `Maximaal €${MAX_TOP_UP} per keer.` };
  const base = Math.max(campaign.totalBudget, spent);
  const totalBudget = Math.round((base + extra) * 100) / 100;
  const ended = !!campaign.endDate && campaign.endDate < today;
  return { totalBudget, endDate: ended ? addDays(today, EXTEND_DAYS) : campaign.endDate };
}
