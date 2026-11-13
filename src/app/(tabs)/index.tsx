import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { dockClearance } from "@/components/Dock";
import { Icon } from "@/components/Icon";
import { BeaconBackground } from "@/components/BeaconBackground";
import { EssentialsDeck } from "@/components/EssentialsDeck";
import { FeedCard } from "@/components/FeedCard";
import { StepTour } from "@/components/StepTour";
import { InstallHint } from "@/components/InstallHint";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { Welcome } from "@/components/Welcome";
import { useContent } from "@/content/provider";
import { islandTrackLabel } from "@/content/labels";
import { readTracks, webTrackStore } from "@/guide/interests";
import { captionOverlapsCard, consumeWalkthrough, firstUnfinished, guideSteps, hasSeenTour, markGuide, markTourSeen, readGuide, stepDone, tourCaption, tourTitle, TOUR_BUBBLE, TOUR_DWELL_MS, WALKTHROUGH_NAME } from "@/guide/path";
import { prefersReducedMotion, readStamps } from "@/guide/stamps";
import { suggestedDayId } from "@/logic/phase";
import { INTRO_DAY_KEY, isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { colors, sceneForIsland } from "@/theme";
import { hasSeenWelcome, markWelcomeSeen, webStorage } from "@/welcome";
import { useApp } from "@/store";

const stepImage: Record<(typeof guideSteps)[number]["id"], string> = {
  welcome: "/reels/tatel-welcome-intro-poster.jpg",
  tracks: "/reels/venues.jpg",
  sessions: "/reels/sessions.jpg",
  transport: "/reels/transport.jpg",
  stay: "/reels/stays.jpg",
  know: "/reels/guide.jpg",
  pass: "/reels/pass.jpg",
  chat: "/reels/community.jpg",
};

type Spot = { top: number; left: number; width: number; height: number };

function hostNode(value: unknown): HTMLElement | null {
  if (!value || typeof window === "undefined") return null;
  if (typeof (value as HTMLElement).getBoundingClientRect === "function") return value as HTMLElement;
  const inner = (value as { getScrollableNode?: () => HTMLElement | null }).getScrollableNode?.();
  return inner ?? null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const { state } = useApp();
  const router = useRouter();
  const { openChapter, replayIntro, openStory, guideTick, reelActive } = useReels();
  const scrollRef = useRef<{ scrollTo: (options: { y?: number; animated?: boolean }) => void; getScrollableNode?: () => HTMLElement | null } | null>(null);
  const cardNodes = useRef<Array<HTMLElement | null>>([]);
  const tourBoot = useRef(false);
  const [touring, setTouring] = useState(false);
  const [tourHold, setTourHold] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [mode, setMode] = useState<"you" | "explore">("you");
  const [welcome, setWelcome] = useState(false);
  const [welcomeStart, setWelcomeStart] = useState<"arrival" | "tracks">("arrival");
  const [deck, setDeck] = useState(false);
  const [tracks, setTracks] = useState<string[]>([]);
  const [marked, setMarked] = useState<string[]>([]);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const store = webTrackStore();
    setTracks(readTracks(store));
    setMarked(readGuide(store));
    setIntroPlayed(localReelStore()?.getItem(INTRO_DAY_KEY) != null);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    if (!hasSeenWelcome(webStorage())) {
      setWelcomeStart("arrival");
      setWelcome(true);
    }
  }, [refresh, guideTick]);

  useFocusEffect(useCallback(() => {
    refresh();
    if (consumeWalkthrough(webStorage())) {
      setMode("you");
      setTourIndex(0);
      setTouring(true);
    }
  }, [refresh]));

  function closeWelcome() {
    markWelcomeSeen(webStorage());
    refresh();
    setWelcome(false);
  }

  const dayId = suggestedDayId(new Date());
  const next = sessions
    .filter((session) => session.dayId === dayId && session.start)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const stamps = readStamps(localReelStore());
  const progress = {
    marked,
    introPlayed,
    trackCount: tracks.length,
    savedSessions: state.favoriteIds.length,
    openedNotes: stamps.some((stamp) => stamp.startsWith("know:")),
  };
  const doneFlags = guideSteps.map((step) => stepDone(step.id, progress));
  const doneCount = doneFlags.filter(Boolean).length;
  const flagsRef = useRef(doneFlags);
  flagsRef.current = doneFlags;

  function placeSpotlight(index: number) {
    const node = cardNodes.current[index];
    const scroller = hostNode(scrollRef.current);
    if (!node || !scroller) return;
    const pad = index === 0 ? 72 : 20;
    const host = scroller.getBoundingClientRect();
    const dockTop = window.innerHeight - dockClearance(insets.bottom);
    const rect = node.getBoundingClientRect();
    const delta = rect.top - host.top - pad;
    if (Math.abs(delta) > 1) scroller.scrollTop += delta;
    let placed = node.getBoundingClientRect();
    if (captionOverlapsCard(placed.top, placed.height, dockTop)) {
      const above = 8 + TOUR_BUBBLE + 12;
      scroller.scrollTop += placed.top - above;
      placed = node.getBoundingClientRect();
    }
    setSpot({ top: placed.top, left: placed.left, width: placed.width, height: placed.height });
  }

  function finishTour() {
    markTourSeen(webStorage());
    setTouring(false);
    setSpot(null);
    const settle = firstUnfinished(flagsRef.current);
    setTourIndex(settle);
    const node = cardNodes.current[settle];
    const scroller = hostNode(scrollRef.current);
    if (node && scroller) {
      const host = scroller.getBoundingClientRect();
      scroller.scrollTop += node.getBoundingClientRect().top - host.top - 72;
    }
  }

  function replayTour() {
    setTourIndex(0);
    setTouring(true);
  }

  useEffect(() => {
    if (!ready || welcome || mode !== "you" || reelActive || tourBoot.current) return;
    tourBoot.current = true;
    if (!hasSeenTour(webStorage())) replayTour();
  }, [ready, welcome, mode, reelActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    Object.values(stepImage).forEach((src) => {
      const photo = new window.Image();
      photo.src = src;
    });
  }, []);

  useEffect(() => {
    if (!touring) return;
    let cancelled = false;
    const align = () => {
      if (!cancelled) placeSpotlight(tourIndex);
    };
    align();
    const frame = requestAnimationFrame(align);
    const timer = setTimeout(align, 80);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [touring, tourIndex]);

  useEffect(() => {
    if (!touring || tourHold || reelActive) return;
    if (prefersReducedMotion()) return;
    const timer = setTimeout(() => {
      if (tourIndex >= guideSteps.length - 1) finishTour();
      else setTourIndex(tourIndex + 1);
    }, TOUR_DWELL_MS);
    return () => clearTimeout(timer);
  }, [touring, tourIndex, tourHold, reelActive]);

  function openStep(id: (typeof guideSteps)[number]["id"]) {
    if (touring) return;
    if (id !== "welcome") {
      markGuide(webTrackStore(), id);
      setMarked(readGuide(webTrackStore()));
    }
    if (id === "welcome") replayIntro();
    if (id === "tracks") {
      setWelcomeStart("tracks");
      setWelcome(true);
    }
    if (id === "sessions") openChapter("sessions", "/agenda");
    if (id === "transport") openChapter("transport", "/transport");
    if (id === "stay") router.push("/stays");
    if (id === "know") setDeck(true);
    if (id === "pass") openChapter("pass", "/passport");
    if (id === "chat") router.push("/community");
  }

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView
        ref={scrollRef as never}
        style={styles.fill}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: dockClearance(insets.bottom) + 48 }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!touring}
      >
        <View style={styles.install}>
          <InstallHint />
        </View>
        <View style={styles.switch}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === "you" }} onPress={() => setMode("you")} style={[styles.switchItem, mode === "you" && styles.switchOn]}>
            <T variant="small" color={mode === "you" ? colors.ink : colors.foam}>For you</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === "explore" }} onPress={() => setMode("explore")} style={[styles.switchItem, mode === "explore" && styles.switchOn]}>
            <T variant="small" color={mode === "explore" ? colors.ink : colors.foam}>Explore</T>
          </Pressable>
        </View>
        {mode === "you" ? (
          <>
            <View style={styles.guideHead}>
              <T variant="headline" color={colors.foam} style={styles.guideTitle}>{WALKTHROUGH_NAME}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Replay Steps Walk-through" onPress={replayTour} style={styles.replayTour}>
                <Icon name="play" size={18} color={colors.ink} />
                <T variant="button" color={colors.ink}>Replay Steps Walk-through</T>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="What is TATEL" onPress={openStory} style={styles.what}>
                <T variant="button" color={colors.gold}>What is TATEL</T>
              </Pressable>
            </View>
            <T variant="meta" color={colors.gold} style={styles.progress}>{doneCount} of {guideSteps.length} done</T>
            {guideSteps.map((step, index) => {
              const done = doneFlags[index];
              return (
                <View key={step.id} pointerEvents={touring ? "none" : "auto"}>
                  <FeedCard
                    cardRef={(node) => { cardNodes.current[index] = hostNode(node); }}
                    image={stepImage[step.id]}
                    alt={step.headline}
                    kicker={`Step ${index + 1} of ${guideSteps.length}`}
                    headline={step.headline}
                    line={step.line}
                    cta={done && step.id === "welcome" ? "Replay" : step.cta}
                    done={done}
                    onPress={() => openStep(step.id)}
                  />
                </View>
              );
            })}
            {next ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Happening next, ${next.title}`}
                onPress={() => router.push({ pathname: "/session/[id]", params: { id: next.id } })}
                style={styles.next}
              >
                <T variant="meta" color={colors.gold}>Happening next</T>
                <T variant="small" color={colors.foam} numberOfLines={2}>{next.title}</T>
                <T variant="meta" color={colors.foam} numberOfLines={2}>{sessionWhen(next, forum.timezone)} · {next.island}</T>
              </Pressable>
            ) : null}
          </>
        ) : (
          forum.pillars.map((pillar) => {
            const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
            const explored = isExplored(localReelStore(), pillar.id);
            const label = islandTrackLabel(pillar.island, pillar.name);
            return (
              <FeedCard
                key={pillar.id}
                image={sceneForIsland(pillar.island)}
                alt={label}
                headline={label}
                line={explored ? "You have opened this island." : "Open this island."}
                cta="Open"
                done={explored}
                onPress={() => {
                  if (zoneId) openChapter(zoneId, { pathname: "/pillar/[id]", params: { id: pillar.id } });
                }}
              />
            );
          })
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Replay the welcome" onPress={replayIntro} style={styles.replay}>
          <T variant="meta" color={colors.gold}>Replay the welcome</T>
        </Pressable>
      </ScrollView>
      {touring && mode === "you" && spot ? (
        <StepTour
          top={spot.top}
          left={spot.left}
          width={spot.width}
          height={spot.height}
          step={tourIndex}
          total={guideSteps.length}
          title={tourTitle(tourIndex)}
          caption={tourCaption(tourIndex)}
          canBack={tourIndex > 0}
          onBack={() => setTourIndex((current) => Math.max(0, current - 1))}
          onNext={() => {
            if (tourIndex >= guideSteps.length - 1) finishTour();
            else setTourIndex((current) => current + 1);
          }}
          onJump={(index) => setTourIndex(index)}
          onHold={setTourHold}
          onSkip={finishTour}
        />
      ) : null}
      {welcome ? <Welcome start={welcomeStart} onClose={closeWelcome} /> : null}
      {deck ? <EssentialsDeck onClose={() => setDeck(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  fill: { flex: 1 },
  install: { marginHorizontal: 16, marginBottom: 4 },
  switch: { flexDirection: "row", alignSelf: "center", marginBottom: 8, padding: 4, borderRadius: 999, backgroundColor: "rgba(7,27,42,0.58)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)" },
  switchItem: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: colors.gold },
  guideHead: { marginHorizontal: 16, marginBottom: 8, gap: 10 },
  guideTitle: { marginHorizontal: 4, marginBottom: 0 },
  replayTour: {
    alignSelf: "stretch",
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.gold,
  },
  what: {
    alignSelf: "stretch",
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(7,27,42,0.72)",
  },
  progress: { marginLeft: 22, marginBottom: 6 },
  next: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 2,
    backgroundColor: "rgba(7,27,42,0.58)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.48)",
  },
  replay: { alignSelf: "center", minHeight: 44, justifyContent: "center", marginBottom: 12 },
});
