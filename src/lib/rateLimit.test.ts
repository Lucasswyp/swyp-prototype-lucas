import { describe, it, expect } from "vitest";
import { getClientIp } from "./rateLimit";

function requestWithHeaders(headers: Record<string, string>) {
  return new Request("https://example.com", { headers });
}

describe("getClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const req = requestWithHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("trims whitespace around the first IP", () => {
    const req = requestWithHeaders({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to 'unknown' when the header is missing", () => {
    const req = requestWithHeaders({});
    expect(getClientIp(req)).toBe("unknown");
  });
});
