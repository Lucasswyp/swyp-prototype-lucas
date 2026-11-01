import { describe, expect, it } from "vitest";
import { COLD_START_AFTER_MS, shouldPlaySplash } from "@/lib/launchSplash";

const now = 1_800_000_000_000;

describe("shouldPlaySplash", () => {
  it("speelt bij de allereerste keer", () => {
    expect(shouldPlaySplash({ now, lastActive: null, shownThisSession: false })).toBe(true);
  });

  it("speelt niet bij verversen of binnen dezelfde sessie", () => {
    expect(shouldPlaySplash({ now, lastActive: now - 10 * COLD_START_AFTER_MS, shownThisSession: true })).toBe(false);
  });

  it("speelt niet bij even sluiten en snel weer openen", () => {
    expect(shouldPlaySplash({ now, lastActive: now - 5 * 60 * 1000, shownThisSession: false })).toBe(false);
    expect(shouldPlaySplash({ now, lastActive: now - COLD_START_AFTER_MS + 1, shownThisSession: false })).toBe(false);
  });

  it("speelt na een paar uur weg zijn", () => {
    expect(shouldPlaySplash({ now, lastActive: now - COLD_START_AFTER_MS, shownThisSession: false })).toBe(true);
    expect(shouldPlaySplash({ now, lastActive: now - 8 * 60 * 60 * 1000, shownThisSession: false })).toBe(true);
  });
});
