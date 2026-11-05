import { isUsableImageUrl } from "@/lib/imageUrl";
import { hasOwnLogo } from "@/lib/businessDefaults";

export type StepState = "done" | "todo" | "waiting" | "problem";

export interface OnboardingStep {
  id: "logo" | "product" | "video" | "approval" | "views";
  title: string;
  text: string;
  state: StepState;
  href?: string;
  action?: string;
}

interface Input {
  logoUrl: string;
  productCount: number;
  adStatuses: ("pending" | "approved" | "rejected")[];
  impressions: number;
}

/** De stappen van een nieuw bedrijf, op volgorde, met wat er al klaar is. */
export function buildOnboardingSteps({ logoUrl, productCount, adStatuses, impressions }: Input): OnboardingStep[] {
  const approved = adStatuses.filter((s) => s === "approved").length;
  const pending = adStatuses.filter((s) => s === "pending").length;
  const rejected = adStatuses.filter((s) => s === "rejected").length;

  const approval: OnboardingStep = (() => {
    const base = { id: "approval" as const, title: "Goedkeuring" };
    if (approved > 0) return { ...base, text: "Je video is goedgekeurd en staat in de feed.", state: "done" as const };
    if (pending > 0) return { ...base, text: "We controleren je video. Dat duurt meestal een dag. Je hoeft niets te doen.", state: "waiting" as const };
    if (rejected > 0)
      return { ...base, text: "Je video is afgekeurd. Maak een nieuwe campagne met een andere video.", state: "problem" as const, href: "/business/campaigns/new", action: "Nieuwe campagne" };
    return { ...base, text: "Zodra je een video uploadt, controleren we die voordat hij live gaat.", state: "todo" as const };
  })();

  return [
    {
      id: "logo",
      title: "Logo of profielfoto",
      text: "Zo herkennen kijkers je bedrijf in de feed en op je profiel.",
      state: isUsableImageUrl(logoUrl) && hasOwnLogo(logoUrl) ? "done" : "todo",
      href: "/business/settings",
      action: "Foto toevoegen",
    },
    {
      id: "product",
      title: "Eerste product",
      text: "Wat je laat zien in je video: een product of dienst, met foto en prijs.",
      state: productCount > 0 ? "done" : "todo",
      href: "/business/products",
      action: "Product toevoegen",
    },
    {
      id: "video",
      title: "Video en campagne",
      text: "Upload een video van maximaal 1 minuut en kies je beloning en budget.",
      state: adStatuses.length > 0 ? "done" : "todo",
      href: "/business/campaigns/new",
      action: "Campagne maken",
    },
    approval,
    {
      id: "views",
      title: "Eerste weergaven",
      text: impressions > 0 ? `Je video is al ${impressions} keer bekeken.` : "Zodra iemand je video bekijkt, zie je dat hier live.",
      state: impressions > 0 ? "done" : "todo",
    },
  ];
}

export function onboardingProgress(steps: OnboardingStep[]) {
  const done = steps.filter((s) => s.state === "done").length;
  return { done, total: steps.length, complete: done === steps.length };
}

/** Goedemorgen, goedemiddag of goedenavond op de lokale tijd van de bezoeker. */
export function greeting(hour: number): string {
  if (hour >= 6 && hour < 12) return "Goedemorgen";
  if (hour >= 12 && hour < 18) return "Goedemiddag";
  if (hour >= 18 && hour < 24) return "Goedenavond";
  return "Goedenacht";
}
