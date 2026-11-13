import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import { parseSingleRange } from "./range";

const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

function env(seen: Request[]) {
  return {
    ASSETS: {
      fetch: async (input: Request | string) => {
        const request = typeof input === "string" ? new Request(input) : input;
        seen.push(request);
        return new Response(bytes, { headers: { ETag: '"coast"', "Content-Type": "video/mp4" } });
      },
    },
  };
}

describe("mp4 range responses", () => {
  it("parses a single byte range and rejects a start past the end", () => {
    expect(parseSingleRange("bytes=0-1", 10)).toEqual({ start: 0, end: 1 });
    expect(parseSingleRange("bytes=8-", 10)).toEqual({ start: 8, end: 9 });
    expect(parseSingleRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 });
    expect(parseSingleRange("bytes=10-", 10)).toBe("unsatisfiable");
    expect(parseSingleRange("bytes=0-1,2-3", 10)).toBeNull();
  });

  it("returns 206 for a range and does not forward Range to the asset", async () => {
    const seen: Request[] = [];
    const response = await worker.fetch(
      new Request("https://tatel.app/beacon/coast/white-bay.mp4", { headers: { Range: "bytes=2-4" } }),
      env(seen),
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 2-4/10");
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Content-Type")).toBe("video/mp4");
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([2, 3, 4]);
    expect(seen[0]?.headers.get("Range")).toBeNull();
    expect(new URL(seen[0]?.url ?? "").pathname).toBe("/beacon/coast/white-bay.mp4");
  });

  it("returns 416 when the range starts past the file", async () => {
    const response = await worker.fetch(
      new Request("https://tatel.app/beacon/coast/white-bay.mp4", { headers: { Range: "bytes=40-50" } }),
      env([]),
    );
    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toBe("bytes */10");
  });

  it("returns 206 for a reel under /reels/", async () => {
    const response = await worker.fetch(
      new Request("https://tatel.app/reels/intro.mp4", { headers: { Range: "bytes=0-2" } }),
      env([]),
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 0-2/10");
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
  });

  it("leaves other files to the asset binding", async () => {
    const fetch = vi.fn(async () => new Response("shell"));
    const response = await worker.fetch(new Request("https://tatel.app/sw.js"), { ASSETS: { fetch } });
    expect(fetch).toHaveBeenCalledOnce();
    expect(await response.text()).toBe("shell");
  });
});
