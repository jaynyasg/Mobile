import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import { isHtmlShell, pwaContentType } from "./pwa";

describe("pwa asset types", () => {
  it("names the manifest and the home-screen icons", () => {
    expect(pwaContentType("/manifest.webmanifest")).toBe("application/manifest+json");
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

  it("keeps icon bytes and forces image/png", async () => {
    const fetch = vi.fn(async () => new Response("png", { headers: { "Content-Type": "application/octet-stream" } }));
    const response = await worker.fetch(new Request("https://tatel.app/icons/icon-180.png"), { ASSETS: { fetch } } as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(await response.text()).toBe("png");
  });
});
