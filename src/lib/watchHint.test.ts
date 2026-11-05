import { describe, expect, it } from "vitest";
import { WATCH_HINT_MAX_VIDEOS, shouldShowWatchHint, watchGoalProgress } from "@/lib/watchHint";

describe("watchHint", () => {
  it("toont de aanwijzing alleen bij de eerste video's", () => {
    expect(shouldShowWatchHint(0)).toBe(true);
    expect(shouldShowWatchHint(WATCH_HINT_MAX_VIDEOS - 1)).toBe(true);
    expect(shouldShowWatchHint(WATCH_HINT_MAX_VIDEOS)).toBe(false);
  });

  it("rekent de voortgang naar het doel van 80%", () => {
    expect(watchGoalProgress(0)).toBe(0);
    expect(watchGoalProgress(40)).toBe(50);
    expect(watchGoalProgress(80)).toBe(100);
    expect(watchGoalProgress(100)).toBe(100);
    expect(watchGoalProgress(-5)).toBe(0);
  });
});
