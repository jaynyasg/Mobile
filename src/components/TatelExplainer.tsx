import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image, Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { reels, type ReelId } from "@/content/reels";
import { storySlides } from "@/logic/tatelStory";
import { prefersReducedMotion } from "@/guide/stamps";
import { colors, fonts } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

const DAY_REELS: ReelId[] = ["tech", "ai", "travel", "entertainment"];

export function TatelExplainer({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const [index, setIndex] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const slides = useMemo(() => {
    const formatsByDay: Record<string, string[]> = {};
    for (const session of sessions) (formatsByDay[session.dayId] ??= []).push(session.format);
    return storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay });
  }, [forum.days, forum.pillars, sessions]);
  const slide = slides[index] ?? slides[0];
  const last = index >= slides.length - 1;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function go(next: number) {
    if (next < 0) return;
    if (next >= slides.length) {
      onClose();
      return;
    }
    setIndex(next);
  }

  function point(event: { nativeEvent: { pageX?: number; pageY?: number; locationX?: number; locationY?: number } }) {
    const native = event.nativeEvent;
    return { x: native.pageX ?? native.locationX ?? 0, y: native.pageY ?? native.locationY ?? 0 };
  }

  function end(event: { nativeEvent: { pageX?: number; pageY?: number; locationX?: number; locationY?: number } }) {
    const origin = start.current;
    start.current = null;
    if (!origin) return;
    const next = point(event);
    const dx = next.x - origin.x;
    const dy = next.y - origin.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  }

  if (!slide) return null;
  const reelId = slide.reelId ?? DAY_REELS[Math.max(0, index - 5)] ?? "venues";
  const reel = reels[reelId];
  const sheet = (
    <View
      style={styles.overlay}
      accessibilityViewIsModal
      accessibilityLabel="What is TATEL"
      onTouchStart={(event) => {
        start.current = point(event);
      }}
      onTouchEnd={end}
    >
      <Film key={slide.id} poster={reel.poster} mp4={slide.kind === "letter" ? reel.mp4 : undefined} />
      <View style={styles.shade} />
      <View style={[styles.copy, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <T variant="eyebrow" color={colors.gold}>{slide.kicker}</T>
        {slide.kind === "letter" ? (
          <View style={styles.letters}>
            {slides.filter((item) => item.kind === "letter").map((item) => (
              <T key={item.id} style={[styles.mark, item.id === slide.id ? styles.markOn : styles.markOff]}>{item.letter}</T>
            ))}
          </View>
        ) : (
          <T style={styles.phase}>{slide.title}</T>
        )}
        {slide.kind === "letter" ? (
          <T variant="title" color={colors.foam}>{slide.title} · {slide.line}</T>
        ) : (
          <T variant="small" color={colors.foam}>{slide.line}</T>
        )}
        <View style={styles.dots}>
          {slides.map((item, dot) => (
            <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Page ${dot + 1} of ${slides.length}`} onPress={() => setIndex(dot)} style={styles.dotHit}>
              <View style={[styles.dot, dot === index && styles.dotOn]} />
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={index === 0} onPress={() => go(index - 1)} style={[styles.nav, index === 0 && styles.navOff]}>
            <Icon name="back" size={18} color={index === 0 ? "rgba(245,241,232,0.35)" : colors.foam} />
            <T variant="button" color={index === 0 ? "rgba(245,241,232,0.35)" : colors.foam}>Back</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onClose} style={styles.ghost}>
            <T variant="button" color={colors.gold}>Skip</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={last ? "Done" : "Next"} onPress={() => go(index + 1)} style={styles.next}>
            <T variant="button" color={colors.ink}>{last ? "Done" : "Next"}</T>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

function Film({ poster, mp4 }: { poster: string; mp4?: string }) {
  const [failed, setFailed] = useState(false);
  const reduce = prefersReducedMotion();
  if (Platform.OS !== "web" || !mp4 || failed || reduce) {
    return <Image source={{ uri: poster }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={styles.photo} pointerEvents="none">
      {createElement("video", {
        autoPlay: true,
        muted: true,
        loop: true,
        playsInline: true,
        poster,
        src: mp4,
        onError: () => setFailed(true),
        ref: (node: HTMLVideoElement | null) => {
          if (!node) return;
          node.muted = true;
          const attempt = node.play();
          if (attempt) attempt.catch(() => setFailed(true));
        },
        style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
      })}
    </View>
  );
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 110, backgroundColor: "#071421" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.94) 0%, rgba(6,14,24,0.55) 42%, rgba(6,14,24,0.28) 100%)" } as ViewStyle),
  },
  copy: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, gap: 12 },
  letters: { flexDirection: "row", gap: 10 },
  mark: { fontFamily: fonts.display, fontSize: 72, lineHeight: 78 },
  markOn: { color: colors.gold },
  markOff: { color: "rgba(245,241,232,0.35)" },
  phase: { fontFamily: fonts.display, fontSize: 48, lineHeight: 52, color: colors.gold },
  dots: { flexDirection: "row", gap: 4 },
  dotHit: { minWidth: 22, minHeight: 28, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: "rgba(255,224,138,0.35)" },
  dotOn: { width: 18, backgroundColor: colors.gold },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  nav: { minHeight: 48, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,224,138,0.48)", flexDirection: "row", alignItems: "center", gap: 2 },
  navOff: { borderColor: "rgba(245,241,232,0.2)" },
  ghost: { minHeight: 48, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  next: { minHeight: 48, paddingHorizontal: 22, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
