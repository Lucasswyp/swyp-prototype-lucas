import type { CampaignObjective, CampaignStatus } from "@/types";

// Gewoon Nederlands in het bedrijfsdashboard. De bewaarde waarden (in de database) blijven
// hetzelfde; alleen wat een ondernemer ziet is vertaald.
export const OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  "Brand awareness": "Naamsbekendheid",
  Engagement: "Interactie",
  "Website traffic": "Bezoek aan je website",
  Sales: "Verkoop",
  "Store visits": "Bezoek aan je winkel",
  "App downloads": "App-downloads",
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  Active: "Actief",
  Paused: "Gepauzeerd",
  Draft: "Concept",
  Completed: "Afgerond",
};

export function objectiveLabel(o: string): string {
  return OBJECTIVE_LABELS[o as CampaignObjective] ?? o;
}

export function statusLabel(s: string): string {
  return STATUS_LABELS[s as CampaignStatus] ?? s;
}
