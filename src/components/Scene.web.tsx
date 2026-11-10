import { createElement, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { scenePhotos } from "@/theme";

const fill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

function prefersStill(): boolean {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function SceneBackground({ uri = scenePhotos.day }: { uri?: string | null }) {
  const [still, setStill] = useState(prefersStill);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const onChange = () => setStill(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  return (
    <View pointerEvents="none" style={fill}>
      {uri
        ? createElement("img", {
            src: uri,
            alt: "",
            className: still ? undefined : "tatel-drift",
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.86) blur(1.5px)" },
          })
        : <View style={[fill, styles.fallback]} />}
      {createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(6,14,24,0.68) 0%, rgba(6,14,24,0.62) 28%, rgba(6,14,24,0.72) 100%)",
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#123044" },
});
