import { Text, TextProps, TextStyle } from "react-native";
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
    fontFamily: fonts.displayMedium,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
  },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.inkSoft,
  },
  button: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.ink },
  rowTitle: { fontFamily: fonts.medium, fontSize: 16.5, lineHeight: 21, color: colors.ink },
};

export function T({
  variant = "body",
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...rest} style={[variants[variant], color ? { color } : null, style]} />;
}
