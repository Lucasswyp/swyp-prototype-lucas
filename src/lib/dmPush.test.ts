import { describe, expect, it } from "vitest";
import { buildDmPushPayload } from "@/lib/dmPush";

const conv = "11111111-1111-1111-1111-111111111111";

describe("buildDmPushPayload", () => {
  it("toont de afzender en het bericht", () => {
    const p = buildDmPushPayload({ senderUsername: "lucas", kind: "text", body: "Hoi!", conversationId: conv });
    expect(p).toEqual({ title: "@lucas", body: "Hoi!", url: `/app/messages/${conv}`, threadId: conv });
  });

  it("meldt een video, met of zonder tekst erbij", () => {
    expect(buildDmPushPayload({ senderUsername: "a", kind: "video", body: null, conversationId: conv }).body).toBe("Stuurde je een video 🎬");
    expect(buildDmPushPayload({ senderUsername: "a", kind: "video", body: "  kijk hier ", conversationId: conv }).body).toBe("Stuurde je een video: kijk hier");
  });

  it("kort lange teksten in en haalt regeleinden weg", () => {
    const p = buildDmPushPayload({ senderUsername: "a", kind: "text", body: "regel een\n\nregel twee " + "x".repeat(300), conversationId: conv });
    expect(p.body.length).toBeLessThanOrEqual(110);
    expect(p.body).not.toContain("\n");
    expect(p.body.endsWith("…")).toBe(true);
  });

  it("valt terug op een nette titel en tekst", () => {
    const p = buildDmPushPayload({ senderUsername: null, kind: "text", body: "   ", conversationId: conv });
    expect(p.title).toBe("Nieuw bericht");
    expect(p.body).toBe("Nieuw bericht");
  });
});
