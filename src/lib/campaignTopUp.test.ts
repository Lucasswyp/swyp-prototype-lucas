import { describe, expect, it } from "vitest";
import { planTopUp } from "@/lib/campaignTopUp";

const today = "2026-10-22";

describe("planTopUp", () => {
  it("telt het extra bedrag op bij wat al besteed is", () => {
    expect(planTopUp({ totalBudget: 100, endDate: "2026-12-01" }, 100, 50, today)).toEqual({ totalBudget: 150, endDate: "2026-12-01" });
  });

  it("neemt het oude budget als dat hoger is dan de uitgaven", () => {
    expect(planTopUp({ totalBudget: 200, endDate: "2026-12-01" }, 120, 25, today)).toEqual({ totalBudget: 225, endDate: "2026-12-01" });
  });

  it("verlengt een afgelopen campagne met 30 dagen vanaf vandaag", () => {
    expect(planTopUp({ totalBudget: 100, endDate: "2026-10-01" }, 100, 50, today)).toEqual({ totalBudget: 150, endDate: "2026-11-21" });
  });

  it("laat een lege einddatum met rust", () => {
    expect(planTopUp({ totalBudget: 10, endDate: "" }, 10, 5, today)).toEqual({ totalBudget: 15, endDate: "" });
  });

  it("rondt af op centen", () => {
    expect(planTopUp({ totalBudget: 10.1, endDate: "" }, 10.1, 5.05, today)).toEqual({ totalBudget: 15.15, endDate: "" });
  });

  it("weigert te kleine, te grote en ongeldige bedragen", () => {
    expect(planTopUp({ totalBudget: 1, endDate: "" }, 1, 4, today)).toHaveProperty("error");
    expect(planTopUp({ totalBudget: 1, endDate: "" }, 1, 10001, today)).toHaveProperty("error");
    expect(planTopUp({ totalBudget: 1, endDate: "" }, 1, NaN, today)).toHaveProperty("error");
  });
});
