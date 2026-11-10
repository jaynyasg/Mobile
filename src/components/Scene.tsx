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
      <View style={[fill, styles.scrim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#E7F3F4" },
  scrim: { backgroundColor: "rgba(255,255,255,0.14)" },
});
