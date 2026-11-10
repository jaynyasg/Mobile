import { Image, StyleSheet } from "react-native";
import type { PlacePhoto as Photo } from "@/content/types";

export function PlacePhoto({ photo, eager = false }: { photo: Photo; eager?: boolean }) {
  return (
    <Image
      source={{ uri: photo.jpeg }}
      style={styles.image}
      resizeMode="cover"
      accessibilityLabel={photo.alt}
      accessibilityIgnoresInvertColors
      fadeDuration={eager ? 0 : 200}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 220, backgroundColor: "#071B2A" },
});
