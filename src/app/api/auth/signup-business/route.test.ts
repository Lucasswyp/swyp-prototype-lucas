import { beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.fn();
const insert = vi.fn();
const deleteUser = vi.fn();
let allowed = true;

vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: async () => allowed, getClientIp: () => "1.2.3.4" }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser: (...a: unknown[]) => createUser(...a), deleteUser: (...a: unknown[]) => deleteUser(...a) } },
    from: () => ({ insert: (...a: unknown[]) => insert(...a) }),
  }),
}));

import { POST } from "./route";
import { BUSINESS_TERMS_VERSION } from "@/lib/businessTerms";

const req = (body: unknown) => new Request("http://x/api/auth/signup-business", { method: "POST", body: JSON.stringify(body) });
const valid = { email: "a@b.nl", password: "geheim123", companyName: "Test BV", category: "Food", location: "Haarlem", acceptedTerms: true };

beforeEach(() => {
  allowed = true;
  createUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  insert.mockReset().mockResolvedValue({ error: null });
  deleteUser.mockReset();
});

describe("POST /api/auth/signup-business", () => {
  it("maakt een account met het akkoord (versie en tijdstip) erbij", async () => {
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    const arg = createUser.mock.calls[0][0];
    expect(arg.user_metadata.business_terms_version).toBe(BUSINESS_TERMS_VERSION);
    expect(new Date(arg.user_metadata.business_terms_accepted_at).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it("weigert zonder akkoord op de voorwaarden", async () => {
    for (const bad of [{ ...valid, acceptedTerms: false }, { ...valid, acceptedTerms: undefined }, { ...valid, acceptedTerms: "true" }]) {
      const res = await POST(req(bad));
      expect(res.status).toBe(400);
    }
    expect(createUser).not.toHaveBeenCalled();
  });

  it("weigert ontbrekende velden en te veel pogingen", async () => {
    expect((await POST(req({ ...valid, companyName: "" }))).status).toBe(400);
    allowed = false;
    expect((await POST(req(valid))).status).toBe(429);
  });

  it("ruimt het account op als het bedrijfsprofiel mislukt", async () => {
    insert.mockResolvedValue({ error: { message: "x" } });
    expect((await POST(req(valid))).status).toBe(500);
    expect(deleteUser).toHaveBeenCalledWith("u1");
  });
});
