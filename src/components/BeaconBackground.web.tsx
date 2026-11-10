import { createElement, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { homeMedia } from "./homeMedia";

function wantsStillFrame(): boolean {
  if (typeof window === "undefined") return true;
  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  return Boolean(motion || saveData);
}

export function BeaconBackground() {
  const [still, setStill] = useState(wantsStillFrame);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const onChange = () => setStill(wantsStillFrame());
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  return (
    <View pointerEvents="none" style={styles.fill}>
      {still ? (
        <Image source={{ uri: homeMedia.poster }} style={styles.media} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        createElement(
          "video",
          {
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true,
            poster: homeMedia.poster,
            onError: () => setStill(true),
            ref: (node: HTMLVideoElement | null) => {
              if (!node) return;
              node.muted = true;
              const attempt = node.play();
              if (attempt) attempt.catch(() => setStill(true));
            },
            style: { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" },
          },
          createElement("source", { src: homeMedia.webm, type: "video/webm" }),
          createElement("source", { src: homeMedia.mp4, type: "video/mp4" }),
        )
      )}
      {createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(6,14,24,0.12) 0%, rgba(6,14,24,0) 18%, rgba(6,14,24,0) 46%, rgba(6,14,24,0.55) 70%, rgba(6,14,24,0.88) 100%)",
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, backgroundColor: "#071B2A" },
  media: { width: "100%", height: "100%" },
});
