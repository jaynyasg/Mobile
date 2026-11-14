import { describe, expect, it } from "vitest";
import {
  FOAM,
  GLASS_OPACITY,
  HOME_SCRIM,
  NIGHT_GLASS,
  PAGE_SCRIM,
  TILE_TOP_OPACITY,
  TILE_TOP_RGB,
  contrastRatio,
  glassOverPhoto,
  scrimAt,
} from "./nightGlass";

const foam = { r: 0xf5, g: 0xf1, b: 0xe8 };
const gold = { r: 0xff, g: 0xe0, b: 0x8a };

/**
 * Brightest blurred cell on public/beacon/coast/white-bay-day.jpg
 * (Gaussian sigma 12, about a 30px backdrop blur) at 43% of the frame height.
 * The same band is the brightest region of the opening video frame.
 * Home, Sessions, Transport, Stays, and Pass all sit on this coast.
 */
const horizon = { r: 252, g: 250, b: 238 };
const horizonY = 0.43;

describe("midnight glass contrast", () => {
  it("stays in the transparent range and clears WCAG AA on the bright coastal band", () => {
    const opacity = Number(NIGHT_GLASS.slice(NIGHT_GLASS.lastIndexOf(",") + 1).replace(")", ""));
    expect(opacity).toBe(GLASS_OPACITY);
    expect(opacity).toBeGreaterThanOrEqual(0.55);
    expect(opacity).toBeLessThanOrEqual(0.62);
    expect(FOAM).toBe("#F5F1E8");

    for (const stops of [HOME_SCRIM, PAGE_SCRIM]) {
      const scrim = scrimAt(stops, horizonY);
      const background = glassOverPhoto(horizon, scrim);
      expect(contrastRatio(foam, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(gold, background)).toBeGreaterThanOrEqual(4.5);
    }

    const behind = glassOverPhoto(horizon, scrimAt(HOME_SCRIM, horizonY), 0);
    const tileBackground = {
      r: Math.round(TILE_TOP_RGB.r * TILE_TOP_OPACITY + behind.r * (1 - TILE_TOP_OPACITY)),
      g: Math.round(TILE_TOP_RGB.g * TILE_TOP_OPACITY + behind.g * (1 - TILE_TOP_OPACITY)),
      b: Math.round(TILE_TOP_RGB.b * TILE_TOP_OPACITY + behind.b * (1 - TILE_TOP_OPACITY)),
    };
    expect(contrastRatio(foam, tileBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(gold, tileBackground)).toBeGreaterThanOrEqual(4.5);
  });
});
