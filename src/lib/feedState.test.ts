import { describe, expect, it } from "vitest";
import { isFeedStateFresh } from "@/lib/feedState";
import { APP_RESUME_REFRESH_MS } from "@/lib/appVisibility";

describe("feed onthouden", () => {
  const now = 1_800_000_000_000;
  it("blijft staan binnen een halfuur", () => {
    expect(isFeedStateFresh(now - 60_000, now)).toBe(true);
    expect(isFeedStateFresh(now - APP_RESUME_REFRESH_MS + 1, now)).toBe(true);
  });
  it("begint opnieuw na een halfuur of bij onzin", () => {
    expect(isFeedStateFresh(now - APP_RESUME_REFRESH_MS, now)).toBe(false);
    expect(isFeedStateFresh(now - 3 * 60 * 60 * 1000, now)).toBe(false);
    expect(isFeedStateFresh(NaN, now)).toBe(false);
  });
});
