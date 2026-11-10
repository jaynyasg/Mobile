import { Image, StyleSheet, View } from "react-native";
import { scenePhotos } from "@/theme";

const fill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

export function SceneBackground({ uri = scenePhotos.day }: { uri?: string | null }) {
  return (
    <View pointerEvents="none" style={fill}>
      {uri ? (
        <Image source={{ uri }} style={fill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={[fill, styles.fallback]} />
      )}
      <View style={[fill, styles.top]} />
      <View style={styles.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#123044" },
  top: { backgroundColor: "rgba(6,14,24,0.66)" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", backgroundColor: "rgba(6,14,24,0.28)" },
});
