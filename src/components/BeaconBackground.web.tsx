import { createElement, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { beaconPoster } from "@/images";

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
        <Image source={beaconPoster} style={styles.media} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        createElement(
          "video",
          {
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true,
            poster: "/beacon/beacon-poster.jpg",
            onError: () => setStill(true),
            ref: (node: HTMLVideoElement | null) => {
              if (!node) return;
              node.muted = true;
              const attempt = node.play();
              if (attempt) attempt.catch(() => setStill(true));
            },
            style: { width: "100%", height: "100%", objectFit: "cover" },
          },
          createElement("source", { src: "/beacon/beacon-720.webm", type: "video/webm" }),
          createElement("source", { src: "/beacon/beacon-720.mp4", type: "video/mp4" }),
        )
      )}
      <View style={styles.shade} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, backgroundColor: "#071B2A" },
  media: { width: "100%", height: "100%" },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(7,27,42,0.72)" },
});
