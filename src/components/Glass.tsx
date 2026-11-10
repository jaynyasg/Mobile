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
        ? "rgba(8,16,28,0.55)"
        : "rgba(8,16,28,0.88)"
      : frosted
        ? "rgba(255,255,255,0.58)"
        : "rgba(255,255,255,0.92)";
  const blurStyle = frosted
    ? ({
        backdropFilter: "blur(10px) saturate(1.15)",
        WebkitBackdropFilter: "blur(10px) saturate(1.15)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -8px 14px rgba(11,27,43,0.08), 0 8px 20px rgba(11,27,43,0.1)",
      } as ViewStyle)
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
              height: "100%",
              background: "linear-gradient(128deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.08) 32%, rgba(255,255,255,0) 48%, rgba(255,224,138,0.16) 100%)",
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
