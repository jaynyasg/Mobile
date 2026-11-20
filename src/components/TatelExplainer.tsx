import { createElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AccessibilityInfo, Image, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type PointerEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reels, type Reel } from "@/content/reels";
import type { EntryIntent } from "@/logic/entryIntent";
import { readIntake } from "@/logic/intake";
import { readOwnedPass } from "@/logic/ownedPass";
import { storyChapters } from "@/logic/tatelStory";
import { readConnection } from "@/reels/gate";
import { colors, fonts } from "@/theme";
import { webStorage } from "@/welcome";
import { notchPadding } from "./notch";
import { StoryDetails, type StoryArea } from "./StoryDetails";
import { T } from "./Text";
import { useOverlayHistory } from "./useOverlayHistory";

const doors = {
  ticket: "Find my ticket",
  stay: "I have a ticket · Plan my stay",
  explore: "Explore TATEL",
} as const;

export function TatelExplainer({ onClose }: { onClose: (intent?: EntryIntent) => void }) {
  const insets = useSafeAreaInsets();
  const compact = useWindowDimensions().height < 650;
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [areaFilm, setAreaFilm] = useState<StoryArea>("tech");
  const [hidden, setHidden] = useState(false);
  const [connection, setConnection] = useState(readConnection);
  const [reader, setReader] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const origin = useRef<{ x: number; y: number; time: number } | null>(null);
  const suppressTap = useRef(0);
  const intent = useRef<EntryIntent | undefined>(undefined);
  const chapter = storyChapters[index];
  const film = chapter?.id === "needs" ? areaFilm : chapter?.film ?? "venues";
  const hub = !chapter;
  const still = connection.reducedMotion || connection.saveData || connection.slow || Platform.OS !== "web";
  const stopped = paused || held || expanded || hidden || hub || reader || connection.reducedMotion;
  const holder = readOwnedPass(webStorage()) || readIntake(webStorage())?.hasPass === "have";
  const order: EntryIntent[] = holder ? ["stay", "ticket", "explore"] : ["ticket", "stay", "explore"];

  useOverlayHistory(Platform.OS === "web", () => onClose(intent.current));
  function finish(choice?: EntryIntent) {
    intent.current = choice;
    if (typeof window !== "undefined" && window.history?.state?.tatelOverlay) window.history.back();
    else onClose(choice);
  }
  function move(to: number) {
    setExpanded(false);
    setHeld(false);
    setIndex(Math.max(0, Math.min(to, storyChapters.length)));
  }

  useEffect(() => {
    if (Platform.OS !== "web") {
      let live = true;
      void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (live) setReader(value); });
      void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) setConnection(state => ({ ...state, reducedMotion: value })); });
      const screenReader = AccessibilityInfo.addEventListener("screenReaderChanged", setReader);
      const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", value => setConnection(state => ({ ...state, reducedMotion: value })));
      return () => { live = false; screenReader.remove(); motion.remove(); };
    }
    const node = dialog.current;
    node?.showModal();
    node?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const network = (navigator as Navigator & { connection?: EventTarget }).connection;
    const refresh = () => setConnection(readConnection());
    const visibility = () => setHidden(document.hidden);
    visibility();
    motion.addEventListener("change", refresh);
    network?.addEventListener?.("change", refresh);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      motion.removeEventListener("change", refresh);
      network?.removeEventListener?.("change", refresh);
      document.removeEventListener("visibilitychange", visibility);
      document.body.style.overflow = previous;
      node?.close();
    };
  }, []);

  useEffect(() => {
    if (stopped) return;
    const timer = setTimeout(() => setIndex(index + 1), index === 0 ? reels.intro.durationMs : 16000);
    return () => clearTimeout(timer);
  }, [index, stopped]);

  useEffect(() => {
    if (!expanded) return;
    const heading = dialog.current?.querySelector<HTMLElement>('[role="heading"]');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [expanded]);

  function endGesture(event: PointerEvent) {
    const start = origin.current;
    origin.current = null;
    setHeld(false);
    if (!start) return;
    const dx = event.nativeEvent.clientX - start.x;
    const dy = event.nativeEvent.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 48) {
      if (Date.now() - start.time > 400) suppressTap.current = Date.now() + 500;
      return;
    }
    suppressTap.current = Date.now() + 500;
    if (Math.abs(dx) > Math.abs(dy)) move(index + (dx < 0 ? 1 : -1));
    else if (dy < 0) setExpanded(true);
  }

  function stageButton(back: boolean) {
    return <Pressable accessibilityRole="button" accessibilityLabel={back ? "Back" : "Next"}
      disabled={back && index === 0} style={back ? styles.backZone : styles.nextZone}
      onPress={() => { if (Date.now() >= suppressTap.current) move(index + (back ? -1 : 1)); }}
    />;
  }

  const sheet = <View style={[styles.frame, Platform.OS !== "web" && styles.nativeOverlay]} accessibilityViewIsModal>
    <View style={[styles.chrome, notchPadding("top", 4, insets.top)]}>
      <View style={styles.progress} accessibilityElementsHidden aria-hidden>
        {storyChapters.map((item, i) => <View key={item.id} style={[styles.segment, i <= index && styles.complete]} />)}
      </View>
      <View style={styles.toolbar}>
        <T color={colors.gold} style={styles.brand}>TATEL</T>
        <View style={styles.tools}>
          {!hub && !expanded && !connection.reducedMotion && !reader ? <Pressable accessibilityRole="button" accessibilityLabel={paused ? "Resume story" : "Pause story"} onPress={() => setPaused(!paused)} style={styles.control}>
            <T variant="button" color={colors.foam}>{paused ? "Resume" : "Pause"}</T>
          </Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={hub ? "Close" : "Skip"} onPress={() => hub ? finish() : move(storyChapters.length)} style={styles.control}>
            <T variant="button" color={colors.gold}>{hub ? "Close" : "Skip"}</T>
          </Pressable>
        </View>
      </View>
    </View>
    <View style={[styles.stage, expanded && styles.stageSmall]}>
      <StoryFilm key={film} reel={reels[film]} still={still} stopped={stopped} />
      {!hub && !expanded ? <View nativeID="tatel-story-gestures" style={styles.zones}
        onPointerDown={event => {
          origin.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY, time: Date.now() };
          suppressTap.current = 0;
          setHeld(true);
        }}
        onPointerUp={endGesture}
        onPointerCancel={() => { origin.current = null; setHeld(false); }}
        onPointerLeave={() => { origin.current = null; setHeld(false); }}>
        {stageButton(true)}{stageButton(false)}
      </View> : null}
    </View>
    <View nativeID={expanded ? "tatel-story-reading" : undefined} style={[styles.panel, expanded && styles.reading, notchPadding("bottom", compact ? 8 : 12, insets.bottom)]} testID="story-caption">
      <ScrollView key={`${index}-${expanded}`} style={styles.scroll} contentContainerStyle={[styles.copy, compact && styles.compactCopy]} keyboardShouldPersistTaps="handled">
        <View nativeID="tatel-story-heading" style={[styles.textGroup, compact && styles.compactGroup]} accessibilityLiveRegion="polite">
          <T variant="eyebrow" color={colors.gold}>{hub ? "Your next move" : `${chapter.numeral} / V   ·   ${chapter.heading}`}</T>
          <T variant="title" accessibilityRole="header" style={compact && styles.compactTitle}>{hub ? "Make it yours." : chapter.headline}</T>
          {!hub && !expanded ? <T variant="body">{chapter.caption}</T> : null}
        </View>
        {expanded && chapter ? <StoryDetails chapter={chapter} onAreaPick={setAreaFilm} /> : null}
        {hub ? order.map((choice, i) => <Pressable accessibilityRole="button" key={choice} onPress={() => finish(choice)} style={styles.door}>
          <T variant="rowTitle" color={i === 0 ? colors.gold : colors.foam}>{doors[choice]}</T>
        </Pressable>) : null}
      </ScrollView>
      <View style={styles.footer}>
        {hub ? <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.detailButton} onPress={() => move(storyChapters.length - 1)}><T variant="button" color={colors.gold}>Back to the story</T></Pressable>
          : <Pressable accessibilityRole="button" aria-expanded={expanded} onPress={() => setExpanded(!expanded)} style={styles.detailButton}>
            <T variant="button" color={colors.gold}>{expanded ? "Back to the film" : chapter.readLabel}</T>
            <T variant="rowTitle" color={colors.gold} aria-hidden>{expanded ? "−" : "+"}</T>
          </Pressable>}
        {index === 0 && !expanded ? <T variant="meta" color={colors.muted}>Tap right to advance, left to go back.</T> : null}
      </View>
    </View>
  </View>;

  if (typeof document === "undefined") return sheet;
  return createPortal(createElement("dialog", {
    ref: dialog, className: "tatel-story", tabIndex: -1, "aria-label": "What is TATEL",
    onCancel: (event: { preventDefault(): void }) => { event.preventDefault(); if (expanded) setExpanded(false); else finish(); },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Tab" && !stopped) setPaused(true);
      if (expanded || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      event.preventDefault();
      move(index + (event.key === "ArrowLeft" ? -1 : 1));
    },
  }, sheet), document.body);
}

function StoryFilm({ reel, still, stopped }: { reel: Reel; still: boolean; stopped: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const node = video.current;
    if (!node || still || failed) return;
    if (stopped) { node.pause(); return; }
    let live = true;
    node.muted = true;
    void node.play()?.catch(() => { if (live) setFailed(true); });
    return () => { live = false; node.pause(); };
  }, [still, stopped, failed]);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
    <Image source={{ uri: reel.poster }} style={styles.photo} resizeMode="cover" />
    {!still && !failed ? createElement("video", {
      ref: video, muted: true, playsInline: true, loop: true, poster: reel.poster, src: reel.mp4,
      "aria-hidden": true, "data-testid": "story-film", onError: () => setFailed(true),
      style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
    }) : null}
  </View>;
}

const styles = StyleSheet.create({
  nativeOverlay: { ...StyleSheet.absoluteFill, zIndex: 110 },
  frame: { flex: 1, width: "100%", alignSelf: "center", minHeight: 0, backgroundColor: colors.stage },
  chrome: { paddingHorizontal: 16, backgroundColor: colors.stage },
  progress: { flexDirection: "row", gap: 5, paddingTop: 8 },
  segment: { height: 2, flex: 1, backgroundColor: colors.inkSoft }, complete: { backgroundColor: colors.gold },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  brand: { fontFamily: fonts.displayMedium, fontSize: 21, lineHeight: 28, letterSpacing: 4 },
  tools: { flexDirection: "row" }, control: { minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  stage: { flex: 1, minHeight: 0, backgroundColor: colors.ink }, stageSmall: { flex: 0.22 },
  photo: { height: "100%", width: "100%" },
  zones: { ...StyleSheet.absoluteFill, flexDirection: "row" }, backZone: { flex: 1 }, nextZone: { flex: 2 },
  panel: { maxHeight: "72%", flexShrink: 1, backgroundColor: colors.stage, borderTopWidth: 1, borderColor: colors.brassSoft },
  reading: { flex: 1, maxHeight: "88%" }, scroll: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
  copy: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 16 },
  compactCopy: { paddingVertical: 10 }, compactGroup: { gap: 6 }, compactTitle: { fontSize: 28, lineHeight: 32 },
  textGroup: { gap: 9 }, footer: { marginHorizontal: 20, borderTopWidth: 1, borderColor: colors.inkSoft },
  detailButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  door: { minHeight: 46, justifyContent: "center", borderTopWidth: 1, borderColor: colors.inkSoft, paddingVertical: 8 },
});
