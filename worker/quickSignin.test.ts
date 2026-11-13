import { describe, expect, it, vi } from "vitest";
import { consumeRate, normalizeEmail, quickSignIn, quickSignInUrl, type RateBook } from "./quickSignin";

const env = {
  SUPABASE_URL: "https://oykwxnzlpxbrfcoejawt.supabase.co",
};

describe("quick sign-in proxy", () => {
  it("normalizes an email address", () => {
    expect(normalizeEmail("  Sansara13@Gmail.com ")).toBe("sansara13@gmail.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });

  it("stops a burst from the same address", () => {
    const book: RateBook = { hits: new Map() };
    for (let index = 0; index < 5; index += 1) expect(consumeRate(book, "1.2.3.4", 1_000)).toBe(true);
    expect(consumeRate(book, "1.2.3.4", 1_000)).toBe(false);
    expect(consumeRate(book, "1.2.3.4", 1_000 + 10 * 60 * 1000)).toBe(true);
  });

  it("returns a session from the edge function and a code hint otherwise", async () => {
    const fetchImpl = vi.fn(async (_input: string, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body ?? "{}")) as { email?: string };
      if (payload.email === "sansara13@gmail.com") {
        return new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh", expires_at: 1, user: { id: "u" } }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "code" }), { status: 403 });
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
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(quickSignInUrl(env.SUPABASE_URL));
    const init = fetchImpl.mock.calls[0]?.[1] as { headers?: Record<string, string>; body?: string } | undefined;
    expect(init?.headers?.["Content-Type"]).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ email: "sansara13@gmail.com" }));

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
    expect(await other.json()).toEqual({ error: "code" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not call the edge function when the Supabase URL is missing", async () => {
    const fetchImpl = vi.fn(async () => new Response("unused"));
    const response = await quickSignIn(
      new Request("https://tatel.app/api/quick-signin", { method: "POST", body: JSON.stringify({ email: "sansara13@gmail.com" }) }),
      {},
      fetchImpl,
      { hits: new Map() },
    );
    expect(response.status).toBe(503);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
