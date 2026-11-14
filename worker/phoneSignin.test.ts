import { describe, expect, it, vi } from "vitest";
import { phoneSignIn, phoneSignInUrl } from "./phoneSignin";

const env = { SUPABASE_URL: "https://oykwxnzlpxbrfcoejawt.supabase.co" };
const token = "header.payload.signature";

describe("phone sign-in proxy", () => {
  it("forwards the Firebase token and email, and returns only the session", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      access_token: "access",
      refresh_token: "refresh",
      user: { id: "u" },
    }), { status: 200 }));
    const response = await phoneSignIn(
      new Request("https://tatel.app/api/phone-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "8.8.8.8" },
        body: JSON.stringify({ email: " Ada@Example.com ", idToken: token, phone: "+1999" }),
      }),
      env,
      fetchImpl,
      { hits: new Map() },
      5_000,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ access_token: "access", refresh_token: "refresh" });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(phoneSignInUrl(env.SUPABASE_URL));
    const init = fetchImpl.mock.calls[0]?.[1] as { body?: string } | undefined;
    expect(init?.body).toBe(JSON.stringify({ email: "ada@example.com", idToken: token }));
  });

  it("passes a phone mismatch through and does not call Supabase without a token", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: "mismatch" }), { status: 403 }));
    const mismatch = await phoneSignIn(
      new Request("https://tatel.app/api/phone-signin", {
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com", idToken: token }),
      }),
      env,
      fetchImpl,
      { hits: new Map() },
      6_000,
    );
    expect(mismatch.status).toBe(403);
    const skipped = vi.fn(async () => new Response("unused"));
    const missing = await phoneSignIn(
      new Request("https://tatel.app/api/phone-signin", {
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com" }),
      }),
      env,
      skipped,
      { hits: new Map() },
    );
    expect(missing.status).toBe(400);
    expect(skipped).not.toHaveBeenCalled();
  });
});
