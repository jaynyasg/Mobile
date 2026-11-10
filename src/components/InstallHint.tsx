import { StyleSheet, View } from "react-native";
import { T } from "./Text";
import { colors, pad } from "@/theme";

export function InstallHint() {
  return (
    <View style={styles.card}>
      <T variant="eyebrow">Install</T>
      <T variant="small">Open this site in Chrome or Safari, then add TATEL · Conversations to your home screen.</T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: pad,
    marginBottom: 12,
    padding: 14,
    gap: 6,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
