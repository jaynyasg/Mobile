import { phoneSignIn } from "./phoneSignin";
import { quickSignIn, type QuickSignInEnv } from "./quickSignin";
import { serveProgram } from "./program";
import { parseSingleRange } from "./range";

interface Env extends QuickSignInEnv {
  ASSETS: { fetch(input: Request | string): Promise<Response> };
}

type ProgramDeps = {
  fetchImpl?: typeof fetch;
  cache?: import("./program").ProgramCache | null;
};

function programDeps(value: unknown): ProgramDeps {
  if (!value || typeof value !== "object") return {};
  if ("fetchImpl" in value || "cache" in value) return value as ProgramDeps;
  return {};
}

function videoHeaders(asset: Response, size: number): Headers {
  const headers = new Headers();
  headers.set("Content-Type", asset.headers.get("Content-Type") || "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600");
  const etag = asset.headers.get("ETag");
  if (etag) headers.set("ETag", etag);
  headers.set("Content-Length", String(size));
  return headers;
}

// Workers static assets answer a Range request with the whole file and no
// Content-Range. Video playback needs 206, so MP4 requests come here first.
export default {
  async fetch(request: Request, env: Env, third?: unknown): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/program") {
      const deps = programDeps(third);
      return serveProgram(request, deps.fetchImpl, deps.cache);
    }
    if (url.pathname === "/api/quick-signin") {
      const deps = programDeps(third);
      return quickSignIn(request, env, deps.fetchImpl as ((input: string, init?: RequestInit) => Promise<Response>) | undefined);
    }
    if (url.pathname === "/api/phone-signin") {
      const deps = programDeps(third);
      return phoneSignIn(request, env, deps.fetchImpl as ((input: string, init?: RequestInit) => Promise<Response>) | undefined);
    }
    if (!url.pathname.toLowerCase().endsWith(".mp4")) return env.ASSETS.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const asset = await env.ASSETS.fetch(new Request(new URL(url.pathname, "https://assets.local/"), { method: "GET" }));
    if (!asset.ok) return asset;
    const body = await asset.arrayBuffer();
    const size = body.byteLength;
    const headers = videoHeaders(asset, size);
    const range = parseSingleRange(request.headers.get("Range") ?? "", size);

    if (range === "unsatisfiable") {
      headers.set("Content-Range", `bytes */${size}`);
      headers.delete("Content-Length");
      return new Response(null, { status: 416, headers });
    }

    if (!range) {
      return new Response(request.method === "HEAD" ? null : body, { status: 200, headers });
    }

    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    const slice = body.slice(range.start, range.end + 1);
    return new Response(request.method === "HEAD" ? null : slice, { status: 206, headers });
  },
};
