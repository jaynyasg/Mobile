import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import { readFileSync } from "node:fs";
import { ensurePwaDocument, installabilityGaps, isHtmlShell, MANIFEST_LINK, pwaContentType } from "./pwa";

describe("pwa asset types", () => {
  it("names the manifest and the home-screen icons", () => {
    expect(pwaContentType("/manifest.webmanifest")).toBe("application/manifest+json");
    expect(pwaContentType("/sw.js")).toBe("text/javascript");
    expect(pwaContentType("/apple-touch-icon.png")).toBe("image/png");
    expect(pwaContentType("/icons/icon-192.png")).toBe("image/png");
    expect(pwaContentType("/icons/icon-512.png")).toBe("image/png");
    expect(pwaContentType("/passport")).toBeNull();
    expect(pwaContentType("/tickets")).toBeNull();
  });

  it("serves a real manifest as manifest+json", async () => {
    const fetch = vi.fn(async () => new Response("{", { headers: { "Content-Type": "application/octet-stream" } }));
    const response = await worker.fetch(new Request("https://tatel.app/manifest.webmanifest"), { ASSETS: { fetch } } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/manifest+json");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(await response.text()).toBe("{");
  });

  it("does not let the HTML shell stand in for a missing icon", async () => {
    const shell = new Response("<!doctype html><title>TATEL</title>", { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
    const fetch = vi.fn(async () => shell);
    const response = await worker.fetch(new Request("https://tatel.app/apple-touch-icon.png"), { ASSETS: { fetch } } as never);
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).not.toContain("text/html");
    expect(isHtmlShell(shell)).toBe(true);
  });

  it("links the manifest and iOS tags on every HTML route", async () => {
    const html = "<!doctype html><html><head><title>TATEL</title></head><body>Hi</body></html>";
    const fetch = vi.fn(async () => new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
    const response = await worker.fetch(new Request("https://tatel.app/tickets"), { ASSETS: { fetch } } as never);
    expect(response.headers.get("Link")).toBe(MANIFEST_LINK);
    const body = await response.text();
    expect(body).toContain('rel="manifest"');
    expect(body).toContain('name="apple-mobile-web-app-capable"');
    expect(body).toContain('name="apple-mobile-web-app-status-bar-style"');
    expect(body).toContain('rel="apple-touch-icon"');
    expect(body).toContain('name="apple-mobile-web-app-title"');
    expect(ensurePwaDocument(body)).toBe(body);
  });

  it("meets Chrome installability for a standalone WebAPK", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    const serviceWorker = readFileSync("public/sw.js", "utf8");
    expect(installabilityGaps(manifest, serviceWorker)).toEqual([]);
    expect(manifest.theme_color).toBe("#071B2A");
    expect(manifest.background_color).toBe(manifest.theme_color);
    expect(manifest.display).toBe("standalone");
  });

  it("keeps icon bytes and forces image/png", async () => {
    const fetch = vi.fn(async () => new Response("png", { headers: { "Content-Type": "application/octet-stream" } }));
    const response = await worker.fetch(new Request("https://tatel.app/icons/icon-180.png"), { ASSETS: { fetch } } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(await response.text()).toBe("png");
  });
});
