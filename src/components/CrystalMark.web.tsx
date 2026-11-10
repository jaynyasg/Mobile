import { createElement } from "react";
import { StyleSheet, TextStyle, View } from "react-native";
import { T } from "./Text";

const shadow = {
  textShadow: "0 2px 10px rgba(7,20,34,0.92), 0 0 2px rgba(7,20,34,0.95)",
} as TextStyle;

export function CrystalMark({ size = "hero" }: { size?: "hero" | "mark" }) {
  const hero = size === "hero";
  return (
    <View style={[styles.row, hero ? styles.hero : styles.mark]} accessibilityRole="header" accessibilityLabel="TATEL">
      {hero ? <Spark /> : null}
      <T variant={hero ? "display" : "eyebrow"} foil style={hero ? [styles.heroText, shadow] : [styles.markText, shadow]}>
        TATEL
      </T>
      {hero ? <Spark late /> : null}
    </View>
  );
}

function Spark({ late = false }: { late?: boolean }) {
  return createElement("span", {
    "aria-hidden": true,
    className: late ? "tatel-twinkle tatel-twinkle-late" : "tatel-twinkle",
    style: {
      width: 8,
      height: 8,
      background: "#FFE08A",
      transform: "rotate(45deg)",
      boxShadow: "0 0 6px rgba(255,224,138,0.9)",
      display: "inline-block",
    },
  });
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  hero: { width: "100%" },
  mark: { alignSelf: "flex-start" },
  heroText: { fontSize: 40, lineHeight: 48, letterSpacing: 10, textAlign: "center" },
  markText: { letterSpacing: 3, color: "#FFE08A" },
});
