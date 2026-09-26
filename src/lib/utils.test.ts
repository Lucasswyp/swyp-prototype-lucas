import { describe, it, expect } from "vitest";
import { formatEuro, formatPercent, timeAgo } from "./utils";

describe("formatEuro", () => {
  it("drops decimals for whole amounts", () => {
    expect(formatEuro(25)).toBe("€ 25");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(formatEuro(25.5)).toBe("€ 25,50");
  });
});

describe("formatPercent", () => {
  it("formats with one decimal by default", () => {
    expect(formatPercent(42.567)).toBe("42.6%");
  });

  it("respects a custom digit count", () => {
    expect(formatPercent(42.567, 0)).toBe("43%");
  });
});

describe("timeAgo", () => {
  it("returns 'zojuist' for a timestamp seconds ago", () => {
    expect(timeAgo(new Date().toISOString())).toBe("zojuist");
  });

  it("formats minutes ago", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(iso)).toBe("5m geleden");
  });

  it("formats hours ago", () => {
    const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(timeAgo(iso)).toBe("3u geleden");
  });
});
