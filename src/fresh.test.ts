import { describe, expect, it } from "vitest";
import { wantsFresh, wipeWebStorage } from "./fresh";

describe("fresh reset", () => {
  it("matches ?fresh on any route and ignores a lookalike name", () => {
    expect(wantsFresh("?fresh")).toBe(true);
    expect(wantsFresh("?fresh=1")).toBe(true);
    expect(wantsFresh("?day=1&fresh")).toBe(true);
    expect(wantsFresh("")).toBe(false);
    expect(wantsFresh("?refresh=1")).toBe(false);
  });

  it("clears both stores and ignores a store that throws", () => {
    const local = new Map<string, string>([["tatel.introDay", "2026-11-13"], ["sb-auth", "token"]]);
    const session = new Map<string, string>([["tatel.reelsSeen", "pass"]]);
    const asStore = (map: Map<string, string>) => ({
      clear: () => map.clear(),
    });
    wipeWebStorage(asStore(local), asStore(session));
    expect(local.size).toBe(0);
    expect(session.size).toBe(0);
    expect(() => wipeWebStorage({ clear: () => { throw new Error("private"); } }, null)).not.toThrow();
  });
});
