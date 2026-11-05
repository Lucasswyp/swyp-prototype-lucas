import { describe, expect, it } from "vitest";
import { INSTALL_HINT_SNOOZE_MS, canAddToHomeScreenOnIos, isIos, shouldShowInstallHint, type Env } from "@/lib/installHint";

const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1";
const INSTAGRAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0 Safari/604.1";
const CAPACITOR = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

const env = (userAgent: string, over: Partial<Env> = {}): Env => ({ userAgent, platform: "iPhone", maxTouchPoints: 5, standalone: false, ...over });

describe("canAddToHomeScreenOnIos", () => {
  it("is waar voor Safari en Chrome op een iPhone", () => {
    expect(canAddToHomeScreenOnIos(env(SAFARI_IPHONE))).toBe(true);
    expect(canAddToHomeScreenOnIos(env(CHROME_IPHONE))).toBe(true);
  });

  it("is onwaar als Swyp al als app op het beginscherm staat", () => {
    expect(canAddToHomeScreenOnIos(env(SAFARI_IPHONE, { standalone: true }))).toBe(false);
  });

  it("is onwaar in de iPhone-app, in andere apps en op Android", () => {
    expect(canAddToHomeScreenOnIos(env(CAPACITOR))).toBe(false);
    expect(canAddToHomeScreenOnIos(env(INSTAGRAM))).toBe(false);
    expect(canAddToHomeScreenOnIos(env(ANDROID, { platform: "Linux armv8l" }))).toBe(false);
  });

  it("herkent een iPad die zich als Mac meldt", () => {
    expect(isIos({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15", platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
    expect(isIos({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 0 })).toBe(false);
  });
});

describe("shouldShowInstallHint", () => {
  const now = 1_000_000_000_000;
  it("toont het als je het nog nooit weggeklikt hebt", () => {
    expect(shouldShowInstallHint(env(SAFARI_IPHONE), null, now)).toBe(true);
  });
  it("blijft weg binnen 30 dagen na wegklikken, komt daarna terug", () => {
    expect(shouldShowInstallHint(env(SAFARI_IPHONE), now - 1000, now)).toBe(false);
    expect(shouldShowInstallHint(env(SAFARI_IPHONE), now - INSTALL_HINT_SNOOZE_MS - 1, now)).toBe(true);
  });
  it("toont niets waar het niet kan", () => {
    expect(shouldShowInstallHint(env(CAPACITOR), null, now)).toBe(false);
  });
});
