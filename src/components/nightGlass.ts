import { ViewStyle } from "react-native";

/** Midnight navy. Composited over white this stays dark enough for #F5F1E8 and gold. */
export const NIGHT_GLASS = "rgba(7,27,42,0.84)";
/** Lightest stop of the Start-here tile gradient. Still opaque enough over white. */
export const TILE_TOP = "rgba(24,52,74,0.9)";
export const TILE_TOP_RGB = { r: 24, g: 52, b: 74 } as const;
export const FOAM = "#F5F1E8";
export const NIGHT_RGB = { r: 7, g: 27, b: 42 } as const;

export const nightGlass: ViewStyle = {
  backgroundColor: NIGHT_GLASS,
  borderWidth: 1,
  borderColor: "rgba(255,224,138,0.48)",
  shadowColor: "#041018",
  shadowOpacity: 0.38,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  ...({
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), 0 12px 28px rgba(4,10,18,0.4)",
  } as ViewStyle),
};

export function compositeOver(opacity: number, background: { r: number; g: number; b: number }) {
  const mix = (channel: number, back: number) => Math.round(channel * opacity + back * (1 - opacity));
  return {
    r: mix(NIGHT_RGB.r, background.r),
    g: mix(NIGHT_RGB.g, background.g),
    b: mix(NIGHT_RGB.b, background.b),
  };
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
