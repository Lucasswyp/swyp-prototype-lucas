import { FIXED_REWARDS } from "@/lib/data";

export type SlideIcon = "video" | "coins" | "gift" | "interests";

export interface Slide {
  icon: SlideIcon;
  title: string;
  body: string;
}

// De uitleg bij de eerste start. Eerlijk over wat er nu is, en met de echte aantallen tokens.
export const ONBOARDING_SLIDES: Slide[] = [
  {
    icon: "video",
    title: "Korte video's van bedrijven",
    body: "Swipe omhoog voor de volgende video. Swyp is nieuw, dus je ziet er nu nog niet veel. Het worden er steeds meer.",
  },
  {
    icon: "coins",
    title: "Verdien tokens met kijken",
    body: `Kijk een video tot het eind (+${FIXED_REWARDS.watch80}), bewaar hem (+${FIXED_REWARDS.save}), klik door (+${FIXED_REWARDS.click}) of like hem (+${FIXED_REWARDS.like}). 1 token is €0,01 waard.`,
  },
  {
    icon: "gift",
    title: "Wissel je tokens in voor korting",
    body: "Bij Rewards kies je een korting van een bedrijf. Bij het afrekenen laat je de code zien.",
  },
  {
    icon: "interests",
    title: "Kies je interesses",
    body: "Dan zie je eerst de video's die bij je passen. Je past ze altijd aan bij Profiel.",
  },
];
