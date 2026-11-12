import { StyleSheet, View } from "react-native";
import { imageUrlsIn } from "@/viewer/photos";
import { TappablePhoto } from "./TappablePhoto";

export function ChatImages({ text, photoUrl, label }: { text: string; photoUrl?: string | null; label: string }) {
  const urls = [
    ...(photoUrl && photoUrl !== "preview" ? [photoUrl] : []),
    ...imageUrlsIn(text),
  ].filter((uri, index, all) => all.indexOf(uri) === index);
  if (!urls.length) return null;
  const gallery = urls.map((uri, index) => ({
    source: uri,
    alt: urls.length > 1 ? `${label}, image ${index + 1}` : label,
  }));
  return (
    <View style={styles.stack}>
      {gallery.map((photo, index) => (
        <TappablePhoto key={`${photo.source}-${index}`} source={photo.source} alt={photo.alt} gallery={gallery} index={index} style={styles.photo} resizeMode="cover" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8, marginTop: 6 },
  photo: { width: "100%", maxWidth: 280, height: 160, borderRadius: 12 },
});
