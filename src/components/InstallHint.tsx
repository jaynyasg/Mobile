import { StyleSheet, View } from "react-native";
import { T } from "./Text";
import { colors } from "@/theme";

export function InstallHint({ tone = "light" }: { tone?: "light" | "dark" }) {
  const ink = tone === "dark" ? colors.onDark : colors.ink;
  return (
    <View style={[styles.card, tone === "dark" && styles.cardDark]}>
      <T variant="eyebrow" color={tone === "dark" ? colors.gold : colors.turquoise}>Install</T>
      <T variant="small" color={ink}>Open this site in Chrome or Safari, then add TATEL · Conversations to your home screen.</T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 12,
    gap: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  cardDark: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.22)" },
});
