import { describe, expect, it } from "vitest";
import { DEFAULT_BUTTON_STYLE, parseButtonStyle } from "@/lib/feedButtonStyle";

describe("parseButtonStyle", () => {
  it("accepteert a en b in elke schrijfwijze", () => {
    expect(parseButtonStyle("a")).toBe("a");
    expect(parseButtonStyle("B")).toBe("b");
    expect(parseButtonStyle(" b ")).toBe("b");
  });

  it("weigert al het andere", () => {
    for (const bad of ["", "c", "ab", null, undefined, "1"]) expect(parseButtonStyle(bad as string | null | undefined)).toBeNull();
  });
});

describe("standaard", () => {
  it("is het glazen kapsel (ontwerp B)", () => {
    expect(DEFAULT_BUTTON_STYLE).toBe("b");
  });
});
