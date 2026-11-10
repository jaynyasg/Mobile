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
  const backgroundColor = tone === "dark" ? "rgba(8,16,28,0.9)" : "rgba(255,255,255,0.94)";
  const crystal = frosted
    ? ({
        borderColor: "transparent",
        backgroundColor: "transparent",
        backgroundImage:
          tone === "dark"
            ? "linear-gradient(180deg, rgba(8,16,28,0.72), rgba(8,16,28,0.58)), linear-gradient(135deg, #ffffff 0%, #b7e6ff 20%, #e4d4ff 46%, #ffe7a8 74%, #ffffff 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.74), rgba(255,255,255,0.58)), linear-gradient(135deg, #ffffff 0%, #b7e6ff 20%, #e4d4ff 46%, #ffe7a8 72%, #e7fff6 100%)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        backdropFilter: "blur(10px) saturate(1.2)",
        WebkitBackdropFilter: "blur(10px) saturate(1.2)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -8px 12px rgba(11,27,43,0.08), 0 8px 18px rgba(11,27,43,0.12)",
      } as ViewStyle)
    : null;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: "rgba(255,255,255,0.85)",
          padding: padded ? 16 : 0,
        },
        crystal,
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
              background: "linear-gradient(128deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.06) 26%, rgba(255,255,255,0) 46%, rgba(255,224,138,0.14) 100%)",
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
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#E7C56A",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  sheen: { position: "absolute", left: 0, right: 0, top: 0, height: "42%", backgroundColor: "rgba(255,255,255,0.14)" },
});
