import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shellColor } from "./shell";

describe("route shell", () => {
  it("keeps the in-app navigation gap midnight", () => {
    expect(shellColor).toBe("#071421");
    const layout = readFileSync("src/app/_layout.tsx", "utf8");
    expect(layout).not.toContain("#E7F3F4");
    expect(layout).not.toContain("colors.paper");
    expect(layout).toContain("backgroundColor: shellColor");
    expect(layout).toContain("export function SuspenseFallback");
    const community = readFileSync("src/app/(tabs)/community.tsx", "utf8");
    expect(community).toContain('import("../community-sign-in")');
  });
});
