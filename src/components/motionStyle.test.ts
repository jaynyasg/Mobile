import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = ["src/components/FeedCard.tsx", "src/components/StampCard.tsx", "src/components/StepTour.tsx"];

function checkStyles(nodeEnv: "development" | "production"): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `process.env.NODE_ENV = ${JSON.stringify(nodeEnv)};
       const { StyleSheet } = require("react-native-web");
       const errors = [];
       console.error = (...args) => errors.push(args.join(" "));
       StyleSheet.create({
         shorthand: { animation: "tatel-shimmer 3.2s ease infinite" },
         shimmer: {
           animationDuration: "3.2s",
           animationTimingFunction: "ease",
           animationIterationCount: "infinite",
           animationKeyframes: {
             from: { backgroundPosition: "100% 0" },
             to: { backgroundPosition: "-100% 0" },
           },
         },
       });
       process.stdout.write(errors.join("\\n"));`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("motion styles", () => {
  it("keeps the animation shorthand out of React Native styles", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/animation:\s*["']/);
      expect(source, file).toContain("animationKeyframes");
    }
    expect(readFileSync("src/components/ZoneMap.tsx", "utf8")).not.toMatch(/\borigin=/);
  });

  it("warns on the shorthand in development and stays quiet in production", () => {
    const dev = checkStyles("development");
    expect(dev.status, dev.stderr).toBe(0);
    expect(dev.stdout).toBe('Invalid style property of "animation". Did you mean "animationKeyframes"?');
    const prod = checkStyles("production");
    expect(prod.status, prod.stderr).toBe(0);
    expect(prod.stdout).toBe("");
  });
});
