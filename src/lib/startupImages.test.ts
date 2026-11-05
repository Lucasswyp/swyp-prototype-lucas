import { describe, expect, it } from "vitest";
import { STARTUP_SIZES, parseStartupFile, startupFile, startupImageLinks } from "@/lib/startupImages";

describe("startupImages", () => {
  it("maakt voor elke schermmaat een bestandsnaam en een regel met de juiste voorwaarden", () => {
    expect(startupFile({ w: 390, h: 844, ratio: 3 })).toBe("1170x2532");
    expect(startupImageLinks).toHaveLength(STARTUP_SIZES.length);
    expect(startupImageLinks[4].media).toContain("device-width: 390px");
    expect(startupImageLinks[4].media).toContain("-webkit-device-pixel-ratio: 3");
    expect(startupImageLinks[4].url).toBe("/startup/1170x2532");
  });

  it("heeft geen twee maten met dezelfde bestandsnaam", () => {
    const names = STARTUP_SIZES.map(startupFile);
    expect(new Set(names).size).toBe(names.length);
  });

  it("accepteert alleen bekende maten, tegen misbruik met enorme plaatjes", () => {
    expect(parseStartupFile("1170x2532")).toEqual({ width: 1170, height: 2532 });
    expect(parseStartupFile("1170x2532.png")).toEqual({ width: 1170, height: 2532 });
    expect(parseStartupFile("9999x9999")).toBeNull();
    expect(parseStartupFile("abc")).toBeNull();
    expect(parseStartupFile("1170x2533")).toBeNull();
  });
});
