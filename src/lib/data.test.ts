import { describe, it, expect } from "vitest";
import { computeAnalytics } from "./data";

const interactions = [
  { event_name: "impression", device_id: "a", ad_id: "ad1" },
  { event_name: "impression", device_id: "b", ad_id: "ad1" },
  { event_name: "watch80", device_id: "a", ad_id: "ad1" },
  { event_name: "like", device_id: "a", ad_id: "ad1" },
  { event_name: "impression", device_id: "c", ad_id: "ad2" },
];

describe("computeAnalytics", () => {
  it("counts events by type across all ads when no adId is given", () => {
    const totals = computeAnalytics(interactions);
    expect(totals.impressions).toBe(3);
    expect(totals.watch80).toBe(1);
    expect(totals.likes).toBe(1);
    expect(totals.saves).toBe(0);
    expect(totals.clicks).toBe(0);
  });

  it("counts unique devices across all interactions", () => {
    const totals = computeAnalytics(interactions);
    expect(totals.uniqueDevices).toBe(3);
  });

  it("filters to a single ad when adId is given", () => {
    const totals = computeAnalytics(interactions, "ad2");
    expect(totals.impressions).toBe(1);
    expect(totals.uniqueDevices).toBe(1);
    expect(totals.watch80).toBe(0);
  });

  it("returns all zeros for an empty interaction list", () => {
    const totals = computeAnalytics([]);
    expect(totals.impressions).toBe(0);
    expect(totals.uniqueDevices).toBe(0);
  });
});
