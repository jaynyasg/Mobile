import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import { PROGRAM_CACHE_CONTROL, type ProgramCache } from "./program";
import { publishedProgramUrl } from "../src/content/published";

const program = JSON.stringify({ sessions: [{ id: "LIVE" }] });

function memoryCache(): ProgramCache & { stored: Map<string, Response> } {
  const stored = new Map<string, Response>();
  return {
    stored,
    async match(request) {
      const found = stored.get(request.url);
      return found ? found.clone() : undefined;
    },
    async put(request, response) {
      stored.set(request.url, response.clone());
    },
  };
}

function assets() {
  return { ASSETS: { fetch: vi.fn(async () => new Response("asset")) } };
}

describe("GET /api/program", () => {
  it("fetches the published file, checks that it is JSON, and caches it", async () => {
    const cache = memoryCache();
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(program, { status: 200 }));
    const response = await worker.fetch(new Request("https://tatel.app/api/program"), assets(), { fetchImpl, cache });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe(PROGRAM_CACHE_CONTROL);
    expect(await response.json()).toEqual({ sessions: [{ id: "LIVE" }] });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(publishedProgramUrl);
    expect(cache.stored.size).toBe(1);

    fetchImpl.mockClear();
    const again = await worker.fetch(new Request("https://tatel.app/api/program"), assets(), { fetchImpl, cache });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ sessions: [{ id: "LIVE" }] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns the last cached copy when the upstream fails", async () => {
    const cache = memoryCache();
    const key = new Request("https://tatel.app/api/program");
    await cache.put(
      key,
      new Response(program, {
        headers: {
          "Content-Type": "application/json",
          "x-program-cached-at": String(Date.now() - 400_000),
        },
      }),
    );
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("nope", { status: 503 }));
    const response = await worker.fetch(key, assets(), { fetchImpl, cache });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(PROGRAM_CACHE_CONTROL);
    expect(await response.json()).toEqual({ sessions: [{ id: "LIVE" }] });
  });

  it("returns 502 when the upstream fails and nothing is cached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("not json", { status: 200 }));
    const response = await worker.fetch(new Request("https://tatel.app/api/program"), assets(), {
      fetchImpl,
      cache: memoryCache(),
    });
    expect(response.status).toBe(502);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("does not serve the asset shell for the program route", async () => {
    const env = assets();
    const response = await worker.fetch(new Request("https://tatel.app/api/program", { method: "POST" }), env, {
      fetchImpl: vi.fn<typeof fetch>(),
      cache: null,
    });
    expect(response.status).toBe(405);
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
});
