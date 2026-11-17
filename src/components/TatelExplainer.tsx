import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { reels } from "@/content/reels";
import { advanceStory, storyBackground, storyBeat, storySlides } from "@/logic/tatelStory";
import { prefersReducedMotion } from "@/guide/stamps";
import { colors, fonts } from "@/theme";
import { Icon } from "./Icon";
import { notchPadding } from "./notch";
import { useOverlayHistory } from "./useOverlayHistory";
import { T } from "./Text";
import type { EntryIntent } from "@/logic/entryIntent";
import { IslandStory } from "./IslandStory";

export function TatelExplainer({ onClose }: { onClose: (intent?: EntryIntent) => void }) {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [paused, setPaused] = useState(false);
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const chosenIntent = useRef<EntryIntent | undefined>(undefined);
  useOverlayHistory(true, () => onClose(chosenIntent.current));
  function finish(intent?: EntryIntent) {
    chosenIntent.current = intent;
    if (typeof window !== "undefined" && window.history.state?.tatelOverlay) window.history.back();
    else onClose(intent);
  }
  const slides = useMemo(() => {
    const formatsByDay: Record<string, string[]> = {};
    for (const session of sessions) (formatsByDay[session.dayId] ??= []).push(session.format);
    return storySlides({ pillars: forum.pillars, days: forum.days, formatsByDay });
  }, [forum.days, forum.pillars, sessions]);
  const slide = slides[index] ?? slides[0];
  const last = index >= slides.length - 1;
  const [film, setFilm] = useState(() => {
    const first = storyBackground(slides[0], null, reels) ?? reels.venues;
    return { poster: first.poster, mp4: first.mp4 };
  });

  useEffect(() => {
    setFilm((current) => {
      const next = storyBackground(slide, current, reels);
      if (!next || next.mp4 === current.mp4) return current;
      return { poster: next.poster, mp4: next.mp4 };
    });
  }, [slide]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const slide = slides[index];
    if (!slide || held || paused || slide.id === "islands" || index === slides.length - 1 || prefersReducedMotion()) return;
    const timer = setTimeout(() => {
      const next = advanceStory(index, slides.length);
      if (next === null) closeRef.current();
      else setIndex(next);
    }, Math.max(storyBeat(slide.kind), `${slide.title} ${slide.line} ${slide.note}`.split(/\s+/).length / 3 * 1000 + 2000));
    return () => clearTimeout(timer);
  }, [held, paused, index, slides]);

  function go(next: number) {
    if (next < 0) return;
    if (next >= slides.length) {
      finish();
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
  const sheet = (
    <View
      style={styles.overlay}
      accessibilityViewIsModal
      accessibilityLabel="What is TATEL"
      onTouchStart={(event) => {
        start.current = point(event);
        setHeld(true);
      }}
      onTouchEnd={(event) => {
        setHeld(false);
        end(event);
      }}
      onTouchCancel={() => setHeld(false)}
      {...({
        onMouseDown: () => setHeld(true),
        onMouseUp: () => setHeld(false),
        onMouseLeave: () => setHeld(false),
      } as ViewStyle)}
    >
      <Film poster={film.poster} mp4={film.mp4} />
      <View style={styles.shade} />
      <View style={[styles.copy, notchPadding("top", 20, insets.top), notchPadding("bottom", 24, insets.bottom)]}>
        <View style={styles.row}>
          <View style={styles.pageInfo}><T variant="meta" color={colors.foam}>{index + 1} / {slides.length}</T>{contentHeight > viewportHeight + 2 ? <T variant="meta" color={colors.gold}>Scroll to read</T> : null}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={paused ? "Resume story" : "Pause story"} onPress={() => setPaused(!paused)} style={styles.ghost}><T variant="button" color={colors.gold}>{paused ? "Resume" : "Pause"}</T></Pressable>
        </View>
        <ScrollView key={slide.id} style={styles.scroll} contentContainerStyle={styles.storyCopy} onContentSizeChange={(_, height) => setContentHeight(height)} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
        <T variant="eyebrow" color={colors.gold}>{slide.kicker}</T>
        {slide.kind === "letter" ? (
          <View style={styles.letters}>
            {slides.filter((item) => item.kind === "letter").map((item) => (
              <T key={item.id} style={[styles.mark, compact && styles.markCompact, item.id === slide.id ? styles.markOn : styles.markOff]}>{item.letter}</T>
            ))}
          </View>
        ) : (
          <T style={slide.title.length > 28 ? styles.phaseSmall : [styles.phase, compact && styles.phaseCompact]}>{slide.title}</T>
        )}
        {slide.kind === "letter" ? <T variant="rowTitle" color={colors.gold}>{slide.title}</T> : null}
        <T variant="headline" color={colors.foam} style={compact && styles.lineCompact}>{slide.line}</T>
        {slide.note ? <T variant="small" color={colors.foam}>{slide.note}</T> : null}
        {slide.id === "islands" ? <IslandStory intro /> : null}
        {last ? <View style={{ gap: 12, marginTop: 16 }}>
          {([['ticket', 'Find my ticket'], ['stay', 'I have a ticket · Plan my stay'], ['explore', 'Explore TATEL']] as const).map(([intent, label]) => <Pressable key={intent} accessibilityRole="button" onPress={() => finish(intent)} style={[styles.next, { minHeight: 48, paddingVertical: 14 }]}><T variant="button" color={colors.ink}>{label}</T></Pressable>)}
        </View> : null}
        </ScrollView>
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
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={() => finish()} style={styles.ghost}>
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

function Film({ poster, mp4 }: { poster: string; mp4: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const reduce = prefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduce) return;
    let live = true;
    const arm = () => {
      if (!live || !node.paused) return;
      node.muted = true;
      node.defaultMuted = true;
      node.loop = true;
      node.playsInline = true;
      node.autoplay = true;
      node.setAttribute("muted", "");
      node.setAttribute("playsinline", "");
      node.setAttribute("webkit-playsinline", "");
      const attempt = node.play();
      if (attempt) attempt.catch(() => undefined);
    };
    arm();
    node.addEventListener("pause", arm);
    node.addEventListener("ended", arm);
    const onVis = () => {
      if (document.visibilityState === "visible") arm();
    };
    document.addEventListener("visibilitychange", onVis);
    const retry = window.setInterval(arm, 1500);
    return () => {
      live = false;
      window.clearInterval(retry);
      node.removeEventListener("pause", arm);
      node.removeEventListener("ended", arm);
      document.removeEventListener("visibilitychange", onVis);
      node.pause();
    };
  }, [mp4, reduce]);

  if (Platform.OS !== "web" || failed || reduce) {
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
          ref.current = node;
          if (!node) return;
          node.muted = true;
          node.defaultMuted = true;
          node.loop = true;
          node.playsInline = true;
          node.setAttribute("muted", "");
          node.setAttribute("playsinline", "");
          node.setAttribute("webkit-playsinline", "");
          node.setAttribute("data-testid", "story-film");
        },
        style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" },
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
  copy: { flex: 1, minHeight: 0, paddingHorizontal: 22, gap: 12, width: "100%", maxWidth: 640, alignSelf: "center" },
  scroll: { flex: 1, minHeight: 0 },
  storyCopy: { flexGrow: 1, justifyContent: "flex-end", gap: 14, paddingVertical: 20 },
  letters: { flexDirection: "row", gap: 10 },
  mark: { fontFamily: fonts.display, fontSize: 52, lineHeight: 60 },
  markCompact: { fontSize: 40, lineHeight: 48 },
  markOn: { color: colors.gold },
  markOff: { color: "rgba(245,241,232,0.35)" },
  phase: { fontFamily: fonts.display, fontSize: 48, lineHeight: 52, color: colors.gold },
  phaseCompact: { fontSize: 36, lineHeight: 40 },
  lineCompact: { fontSize: 20, lineHeight: 26 },
  phaseSmall: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.gold },
  dots: { flexDirection: "row", gap: 2 },
  dotHit: { flex: 1, minWidth: 0, minHeight: 32, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: "rgba(255,224,138,0.35)" },
  dotOn: { width: 18, backgroundColor: colors.gold },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pageInfo: { flexShrink: 1, gap: 2 },
  nav: { minHeight: 48, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,224,138,0.48)", flexDirection: "row", alignItems: "center", gap: 2 },
  navOff: { borderColor: "rgba(245,241,232,0.2)" },
  ghost: { minHeight: 48, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  next: { minHeight: 48, paddingHorizontal: 22, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
