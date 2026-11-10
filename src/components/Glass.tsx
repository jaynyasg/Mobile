import { createElement, ReactNode } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
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
          borderColor: "rgba(255,224,138,0.55)",
          padding: padded ? 16 : 0,
          shadowColor: "#E7C56A",
          shadowOpacity: 0.28,
          shadowRadius: 18,
        },
        blurStyle,
        style,
      ]}
    >
      {Platform.OS === "web"
        ? createElement("div", {
            style: {
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "46%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.34), rgba(255,255,255,0) 72%)",
              pointerEvents: "none",
            },
          })
        : <View pointerEvents="none" style={styles.sheen} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#E7C56A",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  sheen: { position: "absolute", left: 0, right: 0, top: 0, height: "42%", backgroundColor: "rgba(255,255,255,0.14)" },
});
