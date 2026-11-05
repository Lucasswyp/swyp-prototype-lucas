import { describe, expect, it } from "vitest";
import { DEFAULT_BUSINESS_LOGO } from "@/lib/businessDefaults";
import { buildOnboardingSteps, greeting, onboardingProgress } from "@/lib/onboarding";

const empty = { logoUrl: "", productCount: 0, adStatuses: [] as ("pending" | "approved" | "rejected")[], impressions: 0 };
const state = (steps: ReturnType<typeof buildOnboardingSteps>, id: string) => steps.find((s) => s.id === id)!.state;

describe("buildOnboardingSteps", () => {
  it("begint met alles te doen", () => {
    const steps = buildOnboardingSteps(empty);
    expect(steps.map((s) => s.state)).toEqual(["todo", "todo", "todo", "todo", "todo"]);
    expect(onboardingProgress(steps)).toEqual({ done: 0, total: 5, complete: false });
  });

  it("telt een videobestand niet als logo", () => {
    expect(state(buildOnboardingSteps({ ...empty, logoUrl: "https://x.nl/a.mov" }), "logo")).toBe("todo");
    expect(state(buildOnboardingSteps({ ...empty, logoUrl: "https://x.nl/a.png" }), "logo")).toBe("done");
  });

  it("telt het standaardplaatje van een nieuw bedrijf niet als eigen logo", () => {
    expect(state(buildOnboardingSteps({ ...empty, logoUrl: DEFAULT_BUSINESS_LOGO }), "logo")).toBe("todo");
  });

  it("zegt dat de video wordt gecontroleerd zolang hij op goedkeuring wacht", () => {
    const steps = buildOnboardingSteps({ ...empty, adStatuses: ["pending"] });
    expect(state(steps, "video")).toBe("done");
    expect(state(steps, "approval")).toBe("waiting");
  });

  it("wijst bij een afgekeurde video naar een nieuwe campagne", () => {
    const step = buildOnboardingSteps({ ...empty, adStatuses: ["rejected"] }).find((s) => s.id === "approval")!;
    expect(step.state).toBe("problem");
    expect(step.href).toBe("/business/campaigns/new");
  });

  it("een goedgekeurde video gaat voor een afgekeurde of wachtende", () => {
    expect(state(buildOnboardingSteps({ ...empty, adStatuses: ["rejected", "pending", "approved"] }), "approval")).toBe("done");
  });

  it("is klaar als alles gedaan is", () => {
    const steps = buildOnboardingSteps({ logoUrl: "https://x.nl/a.png", productCount: 2, adStatuses: ["approved"], impressions: 3 });
    expect(onboardingProgress(steps).complete).toBe(true);
  });
});

describe("greeting", () => {
  it.each([
    [5, "Goedenacht"],
    [6, "Goedemorgen"],
    [11, "Goedemorgen"],
    [12, "Goedemiddag"],
    [17, "Goedemiddag"],
    [18, "Goedenavond"],
    [23, "Goedenavond"],
    [0, "Goedenacht"],
  ])("om %i uur: %s", (hour, expected) => {
    expect(greeting(hour)).toBe(expected);
  });
});
