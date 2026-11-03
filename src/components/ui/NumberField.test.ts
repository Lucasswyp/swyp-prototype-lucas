import { describe, expect, it } from "vitest";
import { cleanNumberText } from "@/components/ui/NumberField";

describe("cleanNumberText", () => {
  it("haalt voorloopnullen weg zodra er een getal achter komt", () => {
    expect(cleanNumberText("0200", false)).toBe("200");
    expect(cleanNumberText("007", false)).toBe("7");
    expect(cleanNumberText("0", false)).toBe("0");
    expect(cleanNumberText("", false)).toBe("");
  });

  it("laat komma en punt toe voor bedragen, met maximaal twee decimalen", () => {
    expect(cleanNumberText("12,5", true)).toBe("12.5");
    expect(cleanNumberText("0,5", true)).toBe("0.5");
    expect(cleanNumberText("0.", true)).toBe("0.");
    expect(cleanNumberText("9.999", true)).toBe("9.99");
    expect(cleanNumberText("1.2.3", true)).toBe("1.23");
  });

  it("gooit letters en tekens weg", () => {
    expect(cleanNumberText("€ 1a2", false)).toBe("12");
    expect(cleanNumberText("-5", true)).toBe("5");
  });
});
