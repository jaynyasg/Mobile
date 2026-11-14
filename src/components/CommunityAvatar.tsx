import { Image, StyleSheet, View } from "react-native";
import { Monogram } from "./Monogram";

export function CommunityAvatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const radius = size / 2;
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: radius }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Monogram name={name} size={size} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.7)",
    backgroundColor: "rgba(7,27,42,0.72)",
  },
});
