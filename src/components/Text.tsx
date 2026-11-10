import { Text, TextProps, TextStyle } from "react-native";
import { foilMotion } from "./gloss";
import { colors, fonts } from "@/theme";

type Variant = "display" | "title" | "headline" | "body" | "small" | "meta" | "eyebrow" | "button" | "rowTitle";

const variants: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 42,
    lineHeight: 46,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
  },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.inkSoft },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.inkSoft,
  },
  button: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.ink },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.ink },
};

const foil = {
  backgroundImage: "linear-gradient(105deg, #8d6a28 0%, #fff6d2 28%, #f0c85a 50%, #fffaf0 72%, #c4a15a 100%)",
  backgroundSize: "220% 100%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as TextStyle;

export function T({
  variant = "body",
  color,
  foil: gilded = false,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string; foil?: boolean }) {
  const shade = !gilded && (color === colors.onDark || color === colors.onDarkSoft || color === colors.gold);
  return (
    <Text
      {...rest}
      style={[
        variants[variant],
        color && !gilded ? { color } : null,
        shade
          ? { textShadowColor: "rgba(6,14,24,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }
          : null,
        gilded ? foil : null,
        gilded ? foilMotion() : null,
        style,
      ]}
    />
  );
}

