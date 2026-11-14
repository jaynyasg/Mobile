import { useState } from "react";
import { Image, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { ImageResizeMode, ImageSourcePropType } from "react-native";
import type { ViewerPhoto } from "@/viewer/photos";
import { useImageViewer } from "./ImageViewer";

export interface GalleryPhoto {
  source: ImageSourcePropType | string;
  alt: string;
}

export function resolveUri(source: ImageSourcePropType | string | null | undefined): string | null {
  if (!source) return null;
  if (typeof source === "string") return source;
  if (typeof source === "number") return Image.resolveAssetSource(source)?.uri ?? null;
  if (Array.isArray(source)) return resolveUri(source[0]);
  if (typeof source === "object" && "uri" in source && typeof source.uri === "string" && source.uri) return source.uri;
  return null;
}

export function TappablePhoto({
  source,
  alt,
  gallery,
  index = 0,
  style,
  resizeMode = "cover",
  focus = "center",
  onError,
}: {
  source: ImageSourcePropType | string;
  alt: string;
  gallery?: GalleryPhoto[];
  index?: number;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  focus?: string;
  onError?: () => void;
}) {
  const viewer = useImageViewer();
  const [broken, setBroken] = useState(false);
  const label = alt.trim() || "Photo";
  function open() {
    const items = (gallery?.length ? gallery : [{ source, alt: label }])
      .map((item) => {
        const uri = resolveUri(item.source);
        return uri ? { uri, alt: item.alt.trim() || "Photo" } : null;
      })
      .filter((item): item is ViewerPhoto => Boolean(item));
    if (!items.length) return;
    viewer.open(items, index);
  }
  const resolved = typeof source === "string" ? { uri: source } : source;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${label}`}
      onPress={(event) => {
        const stoppable = event as { stopPropagation?: () => void; nativeEvent?: { stopPropagation?: () => void } };
        stoppable.stopPropagation?.();
        stoppable.nativeEvent?.stopPropagation?.();
        open();
      }}
      style={[style, styles.clip]}
    >
      {broken ? <View style={[styles.image, styles.fallback]} /> : (
        <Image
          source={resolved}
          style={[styles.image, { objectPosition: focus } as object]}
          resizeMode={resizeMode}
          onError={() => {
            setBroken(true);
            onError?.();
          }}
          accessible={false}
          accessibilityIgnoresInvertColors
          importantForAccessibility="no"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden", backgroundColor: "#123044" },
  image: { width: "100%", height: "100%" },
  fallback: { backgroundColor: "#123044" },
});
