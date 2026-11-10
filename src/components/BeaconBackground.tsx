import { Image, StyleSheet, View } from "react-native";
import { beaconPoster } from "@/images";

export function BeaconBackground() {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <Image source={beaconPoster} style={styles.media} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.shade} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, backgroundColor: "#071B2A" },
  media: { width: "100%", height: "100%" },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(7,27,42,0.72)" },
});
