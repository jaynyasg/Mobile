import { createPassCheckout, readPassCheckout, type CheckoutEnv } from "./checkout";
import { phoneSignIn } from "./phoneSignin";
import { isHtmlShell, pwaContentType } from "./pwa";
import { quickSignIn, type QuickSignInEnv } from "./quickSignin";
import { serveProgram } from "./program";
import { parseSingleRange } from "./range";
import { handleStripeWebhook, handleVipRequest, notePaidFromStatus, sendDueReminders, type VipEnv } from "./vipBooking";

interface Env extends QuickSignInEnv, CheckoutEnv, VipEnv {
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

async function servePwaAsset(request: Request, env: Env, contentType: string): Promise<Response> {
  const asset = await env.ASSETS.fetch(request);
  if (!asset.ok || isHtmlShell(asset)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }
  const headers = new Headers(asset.headers);
  headers.set("Content-Type", contentType);
  headers.set("X-Content-Type-Options", "nosniff");
  if (contentType === "application/manifest+json") headers.set("Cache-Control", "no-cache");
  return new Response(asset.body, { status: asset.status, headers });
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
    if (url.pathname === "/api/checkout") {
      const deps = programDeps(third);
      return createPassCheckout(request, env, deps.fetchImpl as ((input: string, init?: RequestInit) => Promise<Response>) | undefined);
    }
    if (url.pathname === "/api/checkout/status") {
      const deps = programDeps(third);
      const fetchImpl = deps.fetchImpl as ((input: string, init?: RequestInit) => Promise<Response>) | undefined;
      const response = await readPassCheckout(request, env, fetchImpl);
      if (response.ok) {
        try {
          const body = await response.clone().json() as { status?: string; paymentStatus?: string | null; bookingId?: string | null; shares?: number | null };
          await notePaidFromStatus(env, url.searchParams.get("session_id") ?? "", body, { fetchImpl });
        } catch {
          // Status still returns. The webhook can record the same session.
        }
      }
      return response;
    }
    if (url.pathname === "/api/stripe/webhook") {
      const deps = programDeps(third);
      return handleStripeWebhook(request, env, { fetchImpl: deps.fetchImpl as ((input: string, init?: RequestInit) => Promise<Response>) | undefined });
    }
    if (url.pathname === "/api/vip-booking" || url.pathname.startsWith("/api/vip-booking/")) {
      const deps = programDeps(third);
      return handleVipRequest(request, env, { fetchImpl: deps.fetchImpl as ((input: string, init?: RequestInit) => Promise<Response>) | undefined });
    }
    const pwaType = pwaContentType(url.pathname);
    if (pwaType) return servePwaAsset(request, env, pwaType);
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

  async scheduled(_event: unknown, env: Env, ctx?: { waitUntil?: (promise: Promise<unknown>) => void }) {
    const job = sendDueReminders(env);
    if (ctx?.waitUntil) ctx.waitUntil(job);
    else await job;
  },
};
