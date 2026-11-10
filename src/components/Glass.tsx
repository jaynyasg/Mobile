import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { ReactNode } from "react";
import { radius } from "@/theme";

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
  const backgroundColor =
    tone === "dark"
      ? frosted
        ? "rgba(10,20,35,0.68)"
        : "rgba(10,20,35,0.92)"
      : frosted
        ? "rgba(255,255,255,0.62)"
        : "rgba(255,255,255,0.94)";
  const blurStyle = frosted
    ? ({ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" } as ViewStyle)
    : null;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: tone === "dark" ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.9)",
          padding: padded ? 16 : 0,
        },
        blurStyle,
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
    shadowColor: "#0B1B2B",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
});
