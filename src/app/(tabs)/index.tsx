import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { dockClearance } from "@/components/Dock";
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
import { firstUnfinished, guideSteps, hasSeenTour, markGuide, markTourSeen, readGuide, stepDone, tourCaption } from "@/guide/path";
import { prefersReducedMotion, readStamps } from "@/guide/stamps";
import { suggestedDayId } from "@/logic/phase";
import { INTRO_DAY_KEY, isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { colors, sceneForIsland, scenePhotos } from "@/theme";
import { hasSeenWelcome, markWelcomeSeen, webStorage } from "@/welcome";
import { useApp } from "@/store";

const stepImage: Record<(typeof guideSteps)[number]["id"], string> = {
  welcome: "/reels/tatel-welcome-intro-poster.jpg",
  tracks: sceneForIsland("St. Thomas"),
  sessions: sceneForIsland("St. John"),
  transport: sceneForIsland("St. Thomas"),
  stay: sceneForIsland("Lovango"),
  know: sceneForIsland("Scrub Island"),
  pass: sceneForIsland("Jost Van Dyke"),
  chat: scenePhotos.community,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const { state } = useApp();
  const router = useRouter();
  const { openChapter, replayIntro, guideTick, reelActive } = useReels();
  const scrollRef = useRef<{ scrollTo: (options: { y?: number; animated?: boolean }) => void } | null>(null);
  const cardY = useRef<number[]>([]);
  const tourBoot = useRef(false);
  const [touring, setTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [frames, setFrames] = useState<{ y: number; height: number }[]>([]);
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

  function finishTour() {
    markTourSeen(webStorage());
    setTouring(false);
    const settle = firstUnfinished(flagsRef.current);
    setTourIndex(settle);
    scrollRef.current?.scrollTo({ y: Math.max(0, (cardY.current[settle] ?? 0) - 72), animated: true });
  }

  function replayTour() {
    setTourIndex(0);
    setTouring(true);
    scrollRef.current?.scrollTo({ y: Math.max(0, (cardY.current[0] ?? 0) - 72), animated: true });
  }

  useEffect(() => {
    if (!ready || welcome || mode !== "you" || reelActive || tourBoot.current) return;
    tourBoot.current = true;
    if (!hasSeenTour(webStorage())) replayTour();
  }, [ready, welcome, mode, reelActive]);

  useEffect(() => {
    if (!touring) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, (cardY.current[tourIndex] ?? 0) - 72), animated: true });
    if (prefersReducedMotion()) return;
    const timer = setTimeout(() => {
      if (tourIndex >= guideSteps.length - 1) finishTour();
      else setTourIndex(tourIndex + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [touring, tourIndex]);

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
        style={[styles.fill, { marginBottom: dockClearance(insets.bottom) }]}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!touring}
        onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
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
              <T variant="headline" color={colors.foam} style={styles.guideTitle}>8 steps to get started</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Replay tour" onPress={replayTour} style={styles.replayTour}>
                <T variant="meta" color={colors.gold}>Replay tour</T>
              </Pressable>
            </View>
            <T variant="meta" color={colors.gold} style={styles.progress}>{doneCount} of {guideSteps.length} done</T>
            {guideSteps.map((step, index) => {
              const done = doneFlags[index];
              return (
                <View
                  key={step.id}
                  pointerEvents={touring ? "none" : "auto"}
                  onLayout={(event) => {
                    cardY.current[index] = event.nativeEvent.layout.y;
                    const next = { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height };
                    setFrames((current) => {
                      const copy = current.slice();
                      copy[index] = next;
                      return copy;
                    });
                  }}
                >
                  <FeedCard
                    image={stepImage[step.id]}
                    alt={step.headline}
                    kicker={done ? "Done" : `Step ${index + 1} of ${guideSteps.length}`}
                    headline={step.headline}
                    line={step.line}
                    cta={done && step.id === "welcome" ? "Replay" : step.cta}
                    done={done}
                    lit={touring && tourIndex === index}
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
      {touring && mode === "you" ? (
        <StepTour
          top={Math.max(8, (frames[tourIndex]?.y ?? 0) - scrollY)}
          height={frames[tourIndex]?.height ?? 400}
          caption={tourCaption(tourIndex)}
          canBack={tourIndex > 0}
          onBack={() => setTourIndex((current) => Math.max(0, current - 1))}
          onNext={() => {
            if (tourIndex >= guideSteps.length - 1) finishTour();
            else setTourIndex((current) => current + 1);
          }}
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
  guideHead: { marginHorizontal: 20, marginBottom: 2, gap: 2 },
  guideTitle: { marginHorizontal: 0, marginBottom: 0 },
  replayTour: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
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
