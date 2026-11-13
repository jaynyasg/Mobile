import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image, Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { REEL_FALLBACK_MP4, REEL_FALLBACK_POSTER, showIntroTitle, type Reel } from "@/content/reels";
import { colors } from "@/theme";
import { armReel, hideReelVideo, reelVideoElement } from "@/reels/playback";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

export type ReelExit = "skip" | "enter" | "end";

export function ReelPlayer({
  reel,
  mode,
  src,
  play,
  onDone,
}: {
  reel: Reel;
  mode: "video" | "poster";
  src: string;
  play?: Promise<void>;
  onDone: (reason: ReelExit) => void;
}) {
  const insets = useSafeAreaInsets();
  const [live, setLive] = useState(true);
  const [poster, setPoster] = useState(reel.poster);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [showVideo] = useState(mode === "video" && Platform.OS === "web");
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const onDoneRef = useRef(onDone);
  const finished = useRef(false);
  onDoneRef.current = onDone;

  function finish(reason: ReelExit) {
    if (finished.current) return;
    finished.current = true;
    hideReelVideo();
    setLive(false);
    setTimeout(() => onDoneRef.current(reason), 280);
  }

  useEffect(() => {
    if (!showVideo) return;
    const video = reelVideoElement();
    if (!video) return;
    let cancelled = false;
    const onError = () => {
      if (cancelled) return;
      if (!video.src.endsWith(REEL_FALLBACK_MP4)) {
        setPoster(REEL_FALLBACK_POSTER);
        setCurrentSrc(REEL_FALLBACK_MP4);
        return;
      }
      setBlocked(true);
    };
    const opened = Date.now();
    const sync = () => {
      if (cancelled) return;
      if (!video.paused) {
        setBlocked(false);
        setPlaying(true);
        return;
      }
      if (Date.now() - opened > 500) setBlocked(true);
    };
    video.addEventListener("error", onError);
    video.addEventListener("playing", sync);
    const attempt = currentSrc === src && play ? play : armReel(video, currentSrc);
    attempt.then(sync).catch(sync);
    const watch = window.setInterval(sync, 250);
    return () => {
      cancelled = true;
      window.clearInterval(watch);
      video.removeEventListener("error", onError);
      video.removeEventListener("playing", sync);
    };
  }, [showVideo, play, currentSrc]);

  useEffect(() => {
    if (!playing) return;
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
  }, [playing, reel.durationMs]);

  function retry() {
    const video = reelVideoElement();
    if (!video) return;
    armReel(video, currentSrc).then(() => {
      if (video.paused) {
        setBlocked(true);
        return;
      }
      setBlocked(false);
      setPlaying(true);
    }).catch(() => {
      if (video.paused) setBlocked(true);
      else {
        setBlocked(false);
        setPlaying(true);
      }
    });
  }

  const sheet = (
    <View
      accessibilityViewIsModal
      style={[styles.overlay, { opacity: live ? 1 : 0 }]}
    >
      {!playing ? (
        <Image
          source={{ uri: poster }}
          onError={() => {
            if (poster !== REEL_FALLBACK_POSTER) setPoster(REEL_FALLBACK_POSTER);
          }}
          style={styles.media}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <View pointerEvents="none" style={styles.shade} />
      {blocked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play"
          testID="reel-play"
          onPress={retry}
          style={styles.play}
        >
          <T variant="button" color={colors.ink}>Play</T>
        </Pressable>
      ) : null}
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
      {playing ? (
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
    zIndex: 130,
    backgroundColor: "transparent",
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
  play: {
    position: "absolute",
    top: "42%",
    left: "50%",
    zIndex: 3,
    width: 112,
    height: 112,
    marginLeft: -56,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
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
