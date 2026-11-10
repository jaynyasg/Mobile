import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { T } from "./Text";
import { colors } from "@/theme";

export function InstallHint() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <View style={styles.pill}>
      <T variant="meta" color={colors.onDark}>Add to Home Screen</T>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss install hint" onPress={() => setDismissed(true)} hitSlop={8}>
        <T variant="meta" color={colors.gold}>Close</T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(247,244,239,0.45)",
    backgroundColor: "rgba(7,18,32,0.35)",
  },
});
