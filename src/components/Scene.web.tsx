import { createElement } from "react";
import { StyleSheet, View } from "react-native";
import { scenePhotos } from "@/theme";

const fill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

export function SceneBackground({ uri = scenePhotos.day }: { uri?: string | null }) {
  return (
    <View pointerEvents="none" style={fill}>
      {uri
        ? createElement("img", {
            src: uri,
            alt: "",
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
          })
        : <View style={[fill, styles.fallback]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#123044" },
});
