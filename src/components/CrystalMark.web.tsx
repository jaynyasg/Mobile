import { createElement } from "react";
import { StyleSheet, View } from "react-native";

export function CrystalMark({ size = "hero" }: { size?: "hero" | "mark" }) {
  const hero = size === "hero";
  return (
    <View style={[styles.row, hero ? styles.hero : styles.mark]} accessibilityRole="header" accessibilityLabel="TATEL">
      {createElement("span", { className: hero ? "tatel-gold tatel-gold-hero" : "tatel-gold tatel-gold-mark" }, "TATEL")}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  hero: { width: "100%" },
  mark: { alignSelf: "flex-start" },
});
