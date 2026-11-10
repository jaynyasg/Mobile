import { StyleSheet, View } from "react-native";
import { T } from "./Text";

export function CrystalMark({ size = "hero" }: { size?: "hero" | "mark" }) {
  const hero = size === "hero";
  return (
    <View style={[styles.row, hero ? styles.hero : styles.mark]} accessibilityRole="header" accessibilityLabel="TATEL">
      <T variant={hero ? "display" : "eyebrow"} style={hero ? styles.heroText : styles.markText}>
        TATEL
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  hero: { width: "100%" },
  mark: { alignSelf: "flex-start" },
  heroText: { fontFamily: "Georgia", fontSize: 56, lineHeight: 64, letterSpacing: 8, textAlign: "center", color: "#F0C24F" },
  markText: { fontFamily: "Georgia", letterSpacing: 3, color: "#F0C24F" },
});
