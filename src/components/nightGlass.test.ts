import { describe, expect, it } from "vitest";
import { FOAM, NIGHT_GLASS, NIGHT_RGB, TILE_TOP, TILE_TOP_RGB, compositeOver, contrastRatio } from "./nightGlass";

const foam = { r: 0xf5, g: 0xf1, b: 0xe8 };
const gold = { r: 0xff, g: 0xe0, b: 0x8a };
const white = { r: 255, g: 255, b: 255 };

describe("midnight glass contrast", () => {
  it("keeps body and gold text above WCAG AA on a pure white photo", () => {
    const opacity = Number(NIGHT_GLASS.slice(NIGHT_GLASS.lastIndexOf(",") + 1).replace(")", ""));
    const background = compositeOver(opacity, white);
    expect(contrastRatio(foam, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(gold, background)).toBeGreaterThanOrEqual(4.5);
    expect(FOAM).toBe("#F5F1E8");
    expect(opacity).toBeGreaterThanOrEqual(0.78);
    expect(opacity).toBeLessThanOrEqual(0.85);
    const tileOpacity = Number(TILE_TOP.slice(TILE_TOP.lastIndexOf(",") + 1).replace(")", ""));
    const tile = {
      r: Math.round(TILE_TOP_RGB.r * tileOpacity + 255 * (1 - tileOpacity)),
      g: Math.round(TILE_TOP_RGB.g * tileOpacity + 255 * (1 - tileOpacity)),
      b: Math.round(TILE_TOP_RGB.b * tileOpacity + 255 * (1 - tileOpacity)),
    };
    expect(contrastRatio(foam, tile)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(gold, tile)).toBeGreaterThanOrEqual(4.5);
    expect(NIGHT_RGB).toEqual({ r: 7, g: 27, b: 42 });
  });
});
