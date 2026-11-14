import { Text, TextProps, TextStyle } from "react-native";
import { colors, fonts } from "@/theme";

type Variant = "display" | "title" | "headline" | "body" | "small" | "meta" | "eyebrow" | "button" | "rowTitle";

const readable: TextStyle = {
  textShadowColor: "rgba(4,10,18,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
};

const variants: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: 42,
    lineHeight: 46,
    color: colors.foam,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: colors.foam,
    letterSpacing: -0.4,
    ...readable,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.foam,
    ...readable,
  },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.foam, ...readable },
  small: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.foam, ...readable },
  meta: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.foam, ...readable },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.gold,
  },
  button: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.ink },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.foam, ...readable },
};

const foil = {
  color: "#E8B84A",
} as TextStyle;

export function T({
  variant = "body",
  color,
  foil: gilded = false,
  style,
  numberOfLines,
  ...rest
}: TextProps & { variant?: Variant; color?: string; foil?: boolean }) {
  const shade = !gilded && (color === colors.onDark || color === colors.onDarkSoft || color === colors.gold);
  return (
    <Text
      {...rest}
      numberOfLines={numberOfLines}
      style={[
        variants[variant],
        numberOfLines ? clamp : null,
        color && !gilded ? { color } : null,
        shade
          ? { textShadowColor: "rgba(6,14,24,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }
          : null,
        gilded ? foil : null,
        style,
      ]}
    />
  );
}

const clamp: TextStyle = { flexShrink: 1, minWidth: 0, maxWidth: "100%" };

