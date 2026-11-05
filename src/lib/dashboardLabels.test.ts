import { describe, expect, it } from "vitest";
import { OBJECTIVE_LABELS, STATUS_LABELS, objectiveLabel, statusLabel } from "@/lib/dashboardLabels";

describe("dashboardLabels", () => {
  it("vertaalt alle doelen en statussen, zonder dubbele namen", () => {
    expect(new Set(Object.values(OBJECTIVE_LABELS)).size).toBe(Object.keys(OBJECTIVE_LABELS).length);
    expect(new Set(Object.values(STATUS_LABELS)).size).toBe(Object.keys(STATUS_LABELS).length);
    expect(objectiveLabel("Sales")).toBe("Verkoop");
    expect(statusLabel("Paused")).toBe("Gepauzeerd");
  });

  it("laat een onbekende waarde ongemoeid in plaats van leeg te tonen", () => {
    expect(objectiveLabel("Iets nieuws")).toBe("Iets nieuws");
    expect(statusLabel("Archived")).toBe("Archived");
  });

  it("gebruikt geen Engelse vakwoorden meer", () => {
    const all = [...Object.values(OBJECTIVE_LABELS), ...Object.values(STATUS_LABELS)].join(" ").toLowerCase();
    for (const w of ["awareness", "traffic", "engagement", "active", "paused", "completed", "draft"]) expect(all).not.toContain(w);
  });
});
