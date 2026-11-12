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
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "46%", backgroundColor: "rgba(10,20,35,0.28)" },
});
