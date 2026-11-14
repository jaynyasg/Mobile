import { ReactNode } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { radius } from "@/theme";
import { NIGHT_GLASS } from "./nightGlass";

export function backdropBlurSupported(): boolean {
  if (Platform.OS !== "web") return false;
  const css = (globalThis as { CSS?: { supports?: (property: string, value: string) => boolean } }).CSS;
  if (!css?.supports) return false;
  return css.supports("backdrop-filter", "blur(1px)") || css.supports("-webkit-backdrop-filter", "blur(1px)");
}

export function Glass({
  children,
  tone = "light",
  blur = true,
  padded = true,
  style,
}: {
  children?: ReactNode;
  tone?: "light" | "dark";
  blur?: boolean;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const frosted = blur && backdropBlurSupported();
  const backgroundColor = tone === "dark" ? "rgba(7,27,42,0.62)" : NIGHT_GLASS;
  const crystal = frosted
    ? ({
        backgroundColor,
        borderColor: "rgba(255,224,138,0.48)",
        backdropFilter: "blur(30px) saturate(1.25)",
        WebkitBackdropFilter: "blur(30px) saturate(1.25)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), 0 12px 28px rgba(4,10,18,0.4)",
      } as ViewStyle)
    : null;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: "rgba(255,224,138,0.48)",
          padding: padded ? 16 : 0,
        },
        crystal,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius,
    borderWidth: 1,
    overflow: "hidden",
  },
});
