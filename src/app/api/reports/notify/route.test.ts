import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  user: { id: "auth-1" } as { id: string } | null,
  me: { id: "me" } as { id: string } | null,
  reports: [{ target_type: "message", created_at: new Date().toISOString() }] as { target_type: string; created_at: string }[],
  admins: [{ auth_user_id: "admin-auth" }] as { auth_user_id: string }[],
  adminConsumers: [{ id: "admin-consumer" }] as { id: string }[],
  tokens: [{ id: "t1", token: "tok1" }] as { id: string; token: string }[],
  allowed: true,
};
const sendApnsPush = vi.fn();
const deleted: string[][] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: async () => state.allowed }));
vi.mock("@/lib/apns", () => ({ sendApnsPush: (...a: unknown[]) => sendApnsPush(...a) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const result = () => {
        if (table === "consumers") return { data: state.me };
        if (table === "reports") return { data: state.reports };
        if (table === "admins") return { data: state.admins };
        if (table === "push_tokens") return { data: state.tokens };
        return { data: null };
      };
      const chain: Record<string, unknown> = new Proxy({}, {
        get(_t, prop) {
          if (prop === "then") return undefined;
          if (prop === "maybeSingle") return async () => result();
          if (prop === "limit") return async () => result();
          if (prop === "delete") return () => ({ in: async (_c: string, ids: string[]) => { deleted.push(ids); return {}; } });
          if (prop === "in" && table === "consumers") return async () => ({ data: state.adminConsumers });
          if (prop === "in" && table === "push_tokens") return async () => result();
          if (prop === "select" && table === "admins") return async () => result();
          return () => chain;
        },
      });
      return chain;
    },
  }),
}));

import { POST } from "./route";

beforeEach(() => {
  state.user = { id: "auth-1" };
  state.me = { id: "me" };
  state.reports = [{ target_type: "message", created_at: new Date().toISOString() }];
  state.admins = [{ auth_user_id: "admin-auth" }];
  state.adminConsumers = [{ id: "admin-consumer" }];
  state.tokens = [{ id: "t1", token: "tok1" }];
  state.allowed = true;
  sendApnsPush.mockReset().mockResolvedValue({ ok: true, shouldRemoveToken: false });
  deleted.length = 0;
});

describe("POST /api/reports/notify", () => {
  it("weigert wie niet is ingelogd", async () => {
    state.user = null;
    expect((await POST()).status).toBe(401);
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("remt te snelle meldingen af", async () => {
    state.allowed = false;
    expect(await (await POST()).json()).toEqual({ sent: 0, reason: "throttled" });
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("meldt niets als er geen recente melding is", async () => {
    state.reports = [{ target_type: "message", created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() }];
    expect((await (await POST()).json()).reason).toBe("no_recent_report");
    state.reports = [];
    expect((await (await POST()).json()).reason).toBe("no_recent_report");
    expect(sendApnsPush).not.toHaveBeenCalled();
  });

  it("zegt dat er geen beheerderstoestel is", async () => {
    state.tokens = [];
    expect((await (await POST()).json()).reason).toBe("no_admin_device");
  });

  it("stuurt de beheerder een melding zonder de inhoud van de melding", async () => {
    const json = await (await POST()).json();
    expect(json).toEqual({ sent: 1 });
    expect(sendApnsPush).toHaveBeenCalledWith("tok1", {
      title: "Nieuwe melding bij Swyp",
      body: "Een bericht is gemeld. Bekijk het binnen 24 uur.",
      url: "/admin/reports",
      threadId: "admin-reports",
    });
  });

  it("ruimt een ongeldig apparaat-token op", async () => {
    sendApnsPush.mockResolvedValue({ ok: false, shouldRemoveToken: true });
    const json = await (await POST()).json();
    expect(json).toEqual({ sent: 0 });
    expect(deleted).toEqual([["t1"]]);
  });
});
