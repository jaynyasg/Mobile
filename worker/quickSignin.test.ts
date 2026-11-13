import { describe, expect, it, vi } from "vitest";
import { allowQuickSignIn, consumeRate, normalizeEmail, quickSignIn, type RateBook } from "./quickSignin";

const env = {
  SUPABASE_URL: "https://oykwxnzlpxbrfcoejawt.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
  QUICK_SIGNIN_EMAILS: "sansara13@gmail.com, jamerosg@gmail.com",
};

describe("quick sign-in allowlist", () => {
  it("matches a trimmed, case-insensitive allowlist and ignores everyone else", () => {
    expect(normalizeEmail("  Sansara13@Gmail.com ")).toBe("sansara13@gmail.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(allowQuickSignIn("sansara13@gmail.com", env.QUICK_SIGNIN_EMAILS)).toBe(true);
    expect(allowQuickSignIn("jamerosg@gmail.com", env.QUICK_SIGNIN_EMAILS)).toBe(true);
    expect(allowQuickSignIn("someone@example.com", env.QUICK_SIGNIN_EMAILS)).toBe(false);
  });

  it("stops a burst from the same address", () => {
    const book: RateBook = { hits: new Map() };
    for (let index = 0; index < 5; index += 1) expect(consumeRate(book, "1.2.3.4", 1_000)).toBe(true);
    expect(consumeRate(book, "1.2.3.4", 1_000)).toBe(false);
    expect(consumeRate(book, "1.2.3.4", 1_000 + 10 * 60 * 1000)).toBe(true);
  });

  it("returns a session for an allowlisted email and a code hint otherwise", async () => {
    const fetchImpl = vi.fn(async (input: string, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/admin/generate_link")) {
        return new Response(JSON.stringify({ properties: { hashed_token: "hash-1" } }), { status: 200 });
      }
      if (url.endsWith("/verify")) {
        return new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh" }), { status: 200 });
      }
      return new Response("no", { status: 404 });
    });
    const book: RateBook = { hits: new Map() };
    const ok = await quickSignIn(
      new Request("https://tatel.app/api/quick-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "9.9.9.9" },
        body: JSON.stringify({ email: "Sansara13@gmail.com" }),
      }),
      env,
      fetchImpl,
      book,
      5_000,
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ access_token: "access", refresh_token: "refresh" });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/auth/v1/admin/generate_link");
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain("/auth/v1/verify");
    const init = fetchImpl.mock.calls[0]?.[1] as { headers?: Record<string, string> } | undefined;
    expect(init?.headers?.Authorization).toBe("Bearer service-role-test");

    const other = await quickSignIn(
      new Request("https://tatel.app/api/quick-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "guest@example.com" }),
      }),
      env,
      fetchImpl,
      book,
      6_000,
    );
    expect(other.status).toBe(403);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not call Supabase when the service role is missing", async () => {
    const fetchImpl = vi.fn(async () => new Response("unused"));
    const response = await quickSignIn(
      new Request("https://tatel.app/api/quick-signin", { method: "POST", body: JSON.stringify({ email: "sansara13@gmail.com" }) }),
      { SUPABASE_URL: env.SUPABASE_URL, QUICK_SIGNIN_EMAILS: env.QUICK_SIGNIN_EMAILS },
      fetchImpl,
      { hits: new Map() },
    );
    expect(response.status).toBe(503);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
