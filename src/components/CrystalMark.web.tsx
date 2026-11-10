import { createElement } from "react";
import { StyleSheet, View } from "react-native";

export function CrystalMark({ size = "hero" }: { size?: "hero" | "mark" }) {
  const hero = size === "hero";
  const face = hero ? "tatel-gold tatel-gold-hero" : "tatel-gold tatel-gold-mark";
  const glow = hero ? "tatel-gold-glow tatel-gold-hero" : "tatel-gold-glow tatel-gold-mark";
  return (
    <View style={[styles.row, hero ? styles.hero : styles.mark]} accessibilityRole="header" accessibilityLabel="TATEL">
      {hero ? <Spark /> : null}
      {createElement(
        "span",
        { className: "tatel-gold-wrap" },
        createElement("span", { className: glow, "aria-hidden": true }, "TATEL"),
        createElement("span", { className: face }, "TATEL"),
      )}
      {hero ? <Spark late /> : null}
    </View>
  );
}

function Spark({ late = false }: { late?: boolean }) {
  return createElement("span", {
    "aria-hidden": true,
    className: late ? "tatel-twinkle tatel-twinkle-late" : "tatel-twinkle",
    style: {
      width: 9,
      height: 9,
      background: "#F6E27A",
      transform: "rotate(45deg)",
      boxShadow: "0 0 8px rgba(246,226,122,0.95)",
      display: "inline-block",
    },
  });
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  hero: { width: "100%" },
  mark: { alignSelf: "flex-start" },
});
