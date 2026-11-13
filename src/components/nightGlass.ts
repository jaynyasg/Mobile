import { ViewStyle } from "react-native";

/** Midnight navy, transparent enough for the coast to show through. */
export const GLASS_OPACITY = 0.58;
export const NIGHT_GLASS = `rgba(7,27,42,${GLASS_OPACITY})`;
/** Top of the tile gradient. Same navy, slightly firmer than the panel. */
export const TILE_TOP = "rgba(7,27,42,0.62)";
export const TILE_TOP_RGB = { r: 7, g: 27, b: 42 } as const;
export const TILE_TOP_OPACITY = 0.62;
export const FOAM = "#F5F1E8";
export const NIGHT_RGB = { r: 7, g: 27, b: 42 } as const;
export const SCRIM_RGB = { r: 6, g: 14, b: 24 } as const;

/**
 * Local horizon scrim. The day poster’s brightest blurred band is the water
 * around 30–45% down the frame. These stops darken that band only.
 * Home is the beacon background. Pages are Sessions, Transport, Stays, and Pass.
 */
export const HOME_SCRIM: readonly (readonly [number, number])[] = [
  [0, 0.08],
  [0.28, 0.22],
  [0.42, 0.22],
  [0.54, 0.42],
  [0.72, 0.78],
  [1, 0.92],
];

export const PAGE_SCRIM: readonly (readonly [number, number])[] = [
  [0, 0.28],
  [0.36, 0.22],
  [0.72, 0.4],
  [1, 0.72],
];

export function scrimGradient(stops: readonly (readonly [number, number])[]): string {
  const parts = stops.map(([at, opacity]) => `rgba(6,14,24,${opacity}) ${Math.round(at * 100)}%`);
  return `linear-gradient(to bottom, ${parts.join(", ")})`;
}

export const nightGlass: ViewStyle = {
  backgroundColor: NIGHT_GLASS,
  borderWidth: 1,
  borderColor: "rgba(255,224,138,0.48)",
  shadowColor: "#041018",
  shadowOpacity: 0.38,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  ...({
    backdropFilter: "blur(30px) saturate(1.25)",
    WebkitBackdropFilter: "blur(30px) saturate(1.25)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), 0 12px 28px rgba(4,10,18,0.4)",
  } as ViewStyle),
};

export function scrimAt(stops: readonly (readonly [number, number])[], y: number): number {
  for (let index = 0; index < stops.length - 1; index += 1) {
    const [start, startOpacity] = stops[index];
    const [end, endOpacity] = stops[index + 1];
    if (y <= end) {
      const span = end - start;
      const t = span === 0 ? 0 : (y - start) / span;
      return startOpacity + t * (endOpacity - startOpacity);
    }
  }
  return stops[stops.length - 1][1];
}

export function compositeOver(
  opacity: number,
  background: { r: number; g: number; b: number },
  paint: { r: number; g: number; b: number } = NIGHT_RGB,
) {
  const mix = (channel: number, back: number) => Math.round(channel * opacity + back * (1 - opacity));
  return {
    r: mix(paint.r, background.r),
    g: mix(paint.g, background.g),
    b: mix(paint.b, background.b),
  };
}

/** Photo, then the local scrim, then the glass. */
export function glassOverPhoto(
  photo: { r: number; g: number; b: number },
  scrimOpacity: number,
  glassOpacity = GLASS_OPACITY,
) {
  const behind = compositeOver(scrimOpacity, photo, SCRIM_RGB);
  return compositeOver(glassOpacity, behind, NIGHT_RGB);
}

function linear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: { r: number; g: number; b: number }): number {
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}

export function contrastRatio(foreground: { r: number; g: number; b: number }, background: { r: number; g: number; b: number }): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
