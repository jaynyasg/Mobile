import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { routesLocation } from "./routesRoute";

describe("routes redirect", () => {
  it("keeps the query when an old transport link opens Routes", () => {
    expect(routesLocation()).toBe("/routes");
    expect(routesLocation({ build: "1" })).toBe("/routes?build=1");
    expect(routesLocation({ build: "", day: null })).toBe("/routes");
    const redirect = readFileSync("src/app/transport.tsx", "utf8");
    expect(redirect).toContain("routesLocation");
    expect(redirect).not.toContain("StackHeader");
    const dock = readFileSync("src/components/Dock.tsx", "utf8");
    expect(dock).toContain('label: "Routes"');
    expect(dock).toContain('href: "/routes"');
    expect(dock).toContain('label: "Prep guide"');
    expect(dock).not.toContain('label: "Transport"');
    expect(dock).not.toContain('label: "Guide"');
  });
});
