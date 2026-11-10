import { Image, StyleSheet, View } from "react-native";
import { scenePhotos } from "@/theme";

const fill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

export function DayNightBackground({ day = scenePhotos.day }: { day?: string | null; night?: string | null; phase?: string }) {
  const uri = day || scenePhotos.day;
  return (
    <View pointerEvents="none" style={fill}>
      <Image source={{ uri }} style={fill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.scrim} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...fill, backgroundColor: "rgba(6,14,24,0.2)" },
});
