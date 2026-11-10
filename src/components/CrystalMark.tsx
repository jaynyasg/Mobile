import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";

export function CrystalMark({ size = "hero" }: { size?: "hero" | "mark" }) {
  const hero = size === "hero";
  return (
    <View style={[styles.row, hero ? styles.hero : styles.mark]} accessibilityRole="header" accessibilityLabel="TATEL">
      <T variant={hero ? "display" : "eyebrow"} foil style={hero ? styles.heroText : styles.markText}>
        TATEL
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  hero: { width: "100%" },
  mark: { alignSelf: "flex-start" },
  heroText: { fontSize: 40, lineHeight: 48, letterSpacing: 10, textAlign: "center", color: colors.gold },
  markText: { letterSpacing: 3, color: colors.gold },
});
