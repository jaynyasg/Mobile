import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CrystalMark } from "./CrystalMark";
import { T } from "./Text";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";

export function InstallHint() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <View style={styles.pill}>
      <CrystalMark size="mark" />
      <T variant="meta" color={colors.onDark}>Add to Home Screen</T>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss install hint" onPress={() => setDismissed(true)} hitSlop={8}>
        <T variant="meta" color={colors.gold}>Close</T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...nightGlass,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
});
