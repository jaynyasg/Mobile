import { publishedProgramUrl } from "../src/content/published";

export const PROGRAM_PATH = "/api/program";
export const PROGRAM_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

// Browsers revalidate after 5 minutes. The Cache API copy is kept through the
// stale-while-revalidate window so a failed upstream can still return it.
const FRESH_MS = 300_000;
const RETAIN_SECONDS = 300 + 86_400;
const CACHED_AT = "x-program-cached-at";

export interface ProgramCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export function defaultProgramCache(): ProgramCache | null {
  const storage = (globalThis as { caches?: { default?: ProgramCache } }).caches;
  const cache = storage?.default;
  if (!cache || typeof cache.match !== "function" || typeof cache.put !== "function") return null;
  return cache;
}

export function programCacheKey(request: Request): Request {
  const url = new URL(request.url);
  url.pathname = PROGRAM_PATH;
  url.search = "";
  url.hash = "";
  return new Request(url.toString(), { method: "GET" });
}

function clientHeaders(): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", PROGRAM_CACHE_CONTROL);
  return headers;
}

function cachedAt(response: Response): number | null {
  const value = Number(response.headers.get(CACHED_AT));
  return Number.isFinite(value) ? value : null;
}

async function jsonResponse(body: string | null, status: number, headers: Headers): Promise<Response> {
  return new Response(body, { status, headers });
}

export async function serveProgram(
  request: Request,
  fetchImpl: typeof fetch = fetch,
  cache: ProgramCache | null = defaultProgramCache(),
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const key = programCacheKey(request);
  const cached = cache ? await cache.match(key).catch(() => undefined) : undefined;
  const at = cached ? cachedAt(cached) : null;
  if (cached && at !== null && Date.now() - at < FRESH_MS) {
    const body = request.method === "HEAD" ? null : await cached.text();
    return jsonResponse(body, 200, clientHeaders());
  }

  try {
    const upstream = await fetchImpl(publishedProgramUrl, { method: "GET", headers: { Accept: "application/json" } });
    if (!upstream.ok) throw new Error(String(upstream.status));
    const text = await upstream.text();
    JSON.parse(text);
    if (cache) {
      const stored = new Headers();
      stored.set("Content-Type", "application/json");
      stored.set("Cache-Control", `public, max-age=${RETAIN_SECONDS}`);
      stored.set(CACHED_AT, String(Date.now()));
      await cache.put(key, new Response(text, { status: 200, headers: stored })).catch(() => undefined);
    }
    return jsonResponse(request.method === "HEAD" ? null : text, 200, clientHeaders());
  } catch {
    if (cached) {
      const body = request.method === "HEAD" ? null : await cached.text();
      return jsonResponse(body, 200, clientHeaders());
    }
    return jsonResponse(JSON.stringify({ error: "program unavailable" }), 502, new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    }));
  }
}
