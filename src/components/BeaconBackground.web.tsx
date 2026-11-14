import { useIsFocused } from "expo-router";
import { createElement, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { homeMedia } from "./homeMedia";
import { HOME_SCRIM, scrimGradient } from "./nightGlass";

function wantsStillFrame(): boolean {
  if (typeof window === "undefined") return true;
  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  return Boolean(motion || saveData);
}

export function BeaconBackground() {
  const focused = useIsFocused();
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
      <Image source={{ uri: homeMedia.poster }} style={styles.media} resizeMode="cover" accessibilityIgnoresInvertColors />
      {!still && focused ? (
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
            preload: "metadata",
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" },
          },
          createElement("source", { src: homeMedia.mp4, type: "video/mp4" }),
        )
      ) : null}
      {createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background: scrimGradient(HOME_SCRIM),
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, backgroundColor: "#071B2A" },
  media: { width: "100%", height: "100%" },
});
