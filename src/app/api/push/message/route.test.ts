import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  user: { id: "auth-1" } as { id: string } | null,
  me: { id: "me", username: "lucas" } as { id: string; username: string } | null,
  message: null as Record<string, unknown> | null,
  conversation: { user_a: "me", user_b: "other" } as { user_a: string; user_b: string } | null,
  blocks: [] as unknown[],
  tokens: [{ id: "t1", token: "tok1" }] as { id: string; token: string }[],
  rateAllowed: new Map<string, boolean>(),
};
const sendApnsPush = vi.fn();
const deleted: string[][] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: async (key: string) => (key.startsWith("dmpush:sender") ? (state.rateAllowed.get("sender") ?? true) : (state.rateAllowed.get("conv") ?? true)),
}));
vi.mock("@/lib/apns", () => ({ sendApnsPush: (...a: unknown[]) => sendApnsPush(...a) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const q: Record<string, unknown> = {};
      const result = () => {
        if (table === "consumers") return { data: state.me };
        if (table === "messages") return { data: state.message };
        if (table === "conversations") return { data: state.conversation };
        if (table === "dm_blocks") return { data: state.blocks };
        if (table === "push_tokens") return { data: state.tokens };
        return { data: null };
      };
      const chain = new Proxy(q, {
        get(_t, prop) {
          if (prop === "then") return undefined;
          if (prop === "maybeSingle") return async () => result();
          if (prop === "limit") return async () => result();
          if (prop === "delete") return () => ({ in: async (_c: string, ids: string[]) => { deleted.push(ids); return {}; } });
          if (prop === "eq" && table === "push_tokens") return async () => result();
          return () => chain;
        },
      });
      return chain;
    },
  }),
}));

import { POST } from "./route";

const MSG = "22222222-2222-2222-2222-222222222222";
const req = (body: unknown) => new Request("http://x/api/push/message", { method: "POST", body: JSON.stringify(body) });
const freshMessage = (over: Record<string, unknown> = {}) => ({
  id: MSG, conversation_id: "conv-1", sender_id: "me", kind: "text", body: "Hoi", created_at: new Date().toISOString(), ...over,
});

beforeEach(() => {
  state.user = { id: "auth-1" };
  state.me = { id: "me", username: "lucas" };
  state.message = freshMessage();
  state.conversation = { user_a: "me", user_b: "other" };
  state.blocks = [];
  state.tokens = [{ id: "t1", token: "tok1" }];
  state.rateAllowed.clear();
  sendApnsPush.mockReset().mockResolvedValue({ ok: true, shouldRemoveToken: false });
  deleted.length = 0;
});

describe("POST /api/push/message", () => {
  it("weigert een ongeldig bericht-id", async () => {
    expect((await POST(req({ messageId: "x" }))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
  });

  it("weigert wie niet is ingelogd", async () => {
    state.user = null;
    expect((await POST(req({ messageId: MSG }))).status).toBe(401);
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("weigert een bericht van iemand anders", async () => {
    state.message = freshMessage({ sender_id: "someone-else" });
    expect((await POST(req({ messageId: MSG }))).status).toBe(404);
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("stuurt geen melding voor een oud bericht", async () => {
    state.message = freshMessage({ created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() });
    const json = await (await POST(req({ messageId: MSG }))).json();
    expect(json).toEqual({ sent: 0, reason: "too_old" });
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("stuurt geen melding bij een blokkade", async () => {
    state.blocks = [{ blocker_id: "other" }];
    expect((await (await POST(req({ messageId: MSG }))).json()).reason).toBe("blocked");
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("remt snelle berichten in hetzelfde gesprek af", async () => {
    state.rateAllowed.set("conv", false);
    expect((await (await POST(req({ messageId: MSG }))).json()).reason).toBe("throttled");
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("remt een afzender af die te veel meldt", async () => {
    state.rateAllowed.set("sender", false);
    expect((await POST(req({ messageId: MSG }))).status).toBe(429);
  });

  it("meldt dat de ontvanger geen toestel heeft", async () => {
    state.tokens = [];
    expect((await (await POST(req({ messageId: MSG }))).json()).reason).toBe("no_device");
  });

  it("stuurt de melding met afzender, tekst en link naar het gesprek", async () => {
    const json = await (await POST(req({ messageId: MSG }))).json();
    expect(json).toEqual({ sent: 1 });
    expect(sendApnsPush).toHaveBeenCalledWith("tok1", { title: "@lucas", body: "Hoi", url: "/app/messages/conv-1", threadId: "conv-1" });
  });

  it("stuurt naar elk toestel en ruimt ongeldige tokens op", async () => {
    state.tokens = [{ id: "t1", token: "tok1" }, { id: "t2", token: "tok2" }];
    sendApnsPush.mockResolvedValueOnce({ ok: true, shouldRemoveToken: false }).mockResolvedValueOnce({ ok: false, shouldRemoveToken: true });
    const json = await (await POST(req({ messageId: MSG }))).json();
    expect(json).toEqual({ sent: 1 });
    expect(deleted).toEqual([["t2"]]);
  });

  it("noemt een video-bericht een video", async () => {
    state.message = freshMessage({ kind: "video", body: null });
    await POST(req({ messageId: MSG }));
    expect(sendApnsPush.mock.calls[0][1].body).toBe("Stuurde je een video 🎬");
  });
});
