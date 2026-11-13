import { createElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image, Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { REEL_FALLBACK_MP4, REEL_FALLBACK_POSTER, showIntroTitle, type Reel } from "@/content/reels";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

export type ReelExit = "skip" | "enter" | "end";

export function ReelPlayer({
  reel,
  mode,
  onDone,
}: {
  reel: Reel;
  mode: "video" | "poster";
  onDone: (reason: ReelExit) => void;
}) {
  const insets = useSafeAreaInsets();
  const [live, setLive] = useState(true);
  const [poster, setPoster] = useState(reel.poster);
  const [src, setSrc] = useState(reel.mp4);
  const [showVideo, setShowVideo] = useState(mode === "video" && Platform.OS === "web");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const onDoneRef = useRef(onDone);
  const finished = useRef(false);
  onDoneRef.current = onDone;

  function finish(reason: ReelExit) {
    if (finished.current) return;
    finished.current = true;
    setLive(false);
    setTimeout(() => onDoneRef.current(reason), 280);
  }

  useEffect(() => {
    if (!showVideo) return;
    const started = Date.now();
    const tick = setInterval(() => {
      const elapsedMs = Date.now() - started;
      setElapsed(elapsedMs);
      setProgress(Math.min(1, elapsedMs / reel.durationMs));
    }, 100);
    const end = setTimeout(() => finish("end"), reel.durationMs);
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [showVideo, reel.durationMs]);

  const sheet = (
    <View
      accessibilityViewIsModal
      style={[styles.overlay, { opacity: live ? 1 : 0 }]}
    >
      <Image
        source={{ uri: poster }}
        onError={() => {
          if (poster !== REEL_FALLBACK_POSTER) setPoster(REEL_FALLBACK_POSTER);
        }}
        style={styles.media}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {showVideo
        ? createElement(
            "video",
            {
              key: src,
              autoPlay: true,
              muted: true,
              playsInline: true,
              poster,
              preload: "metadata",
              onError: () => {
                if (src !== REEL_FALLBACK_MP4) setSrc(REEL_FALLBACK_MP4);
                else setShowVideo(false);
              },
              ref: (node: HTMLVideoElement | null) => {
                if (!node) return;
                node.muted = true;
                const attempt = node.play();
                if (attempt) attempt.catch(() => setShowVideo(false));
              },
              style: {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
            },
            createElement("source", { src, type: "video/mp4" }),
          )
        : null}
      <View pointerEvents="none" style={styles.shade} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={reel.kind === "intro" ? "Skip intro" : "Skip"}
        testID="reel-skip"
        onPress={() => finish("skip")}
        style={[styles.skip, { top: insets.top + 12 }]}
      >
        <T variant="button" color={colors.foam}>Skip</T>
      </Pressable>
      <View style={[styles.copy, { bottom: Math.max(insets.bottom, 16) + 28 }]}>
        <T variant="eyebrow" color={colors.gold}>{reel.kicker}</T>
        {reel.kind !== "intro" || showIntroTitle(elapsed, reel.durationMs) ? (
          <T variant="title" color={colors.foam}>{reel.title}</T>
        ) : null}
        {reel.kind === "chapter" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Enter ${reel.title}`}
            testID="reel-enter"
            onPress={() => finish("enter")}
            style={styles.enter}
          >
            <T variant="button" color={colors.ink}>Enter</T>
          </Pressable>
        ) : null}
      </View>
      {showVideo ? (
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.bar, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: {
    ...fixed,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 120,
    backgroundColor: "#071421",
    ...({ transition: "opacity 280ms ease" } as ViewStyle),
  },
  media: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to bottom, rgba(6,14,24,0.2) 18%, rgba(6,14,24,0.78) 100%)" } as ViewStyle),
  },
  skip: {
    position: "absolute",
    right: 16,
    zIndex: 2,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    ...nightGlass,
  },
  copy: { position: "absolute", left: 16, right: 16, gap: 8, zIndex: 2 },
  enter: {
    alignSelf: "flex-start",
    minHeight: 48,
    marginTop: 8,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { position: "absolute", left: 0, right: 0, bottom: 0, height: 2, backgroundColor: "rgba(255,224,138,0.28)" },
  bar: { height: 2, backgroundColor: colors.gold },
});
