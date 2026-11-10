import { StyleSheet, View } from "react-native";
import { T } from "./Text";

export function CrystalMark() {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <T variant="display" style={styles.word}>TATEL</T>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  word: { color: "#F4FBFF", letterSpacing: 8, textShadowColor: "rgba(6,14,24,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
});
