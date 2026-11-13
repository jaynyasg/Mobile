import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { BeaconBackground } from "@/components/BeaconBackground";
import { EssentialsDeck } from "@/components/EssentialsDeck";
import { FeedCard } from "@/components/FeedCard";
import { InstallHint } from "@/components/InstallHint";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { Welcome } from "@/components/Welcome";
import { useContent } from "@/content/provider";
import { islandTrackLabel } from "@/content/labels";
import { readTracks, webTrackStore } from "@/guide/interests";
import { guideSteps, markGuide, readGuide, stepDone } from "@/guide/path";
import { readStamps } from "@/guide/stamps";
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
  const { openChapter, replayIntro, guideTick } = useReels();
  const [mode, setMode] = useState<"you" | "explore">("you");
  const [welcome, setWelcome] = useState(false);
  const [welcomeStart, setWelcomeStart] = useState<"arrival" | "tracks">("arrival");
  const [deck, setDeck] = useState(false);
  const [tracks, setTracks] = useState<string[]>([]);
  const [marked, setMarked] = useState<string[]>([]);
  const [introPlayed, setIntroPlayed] = useState(false);

  const refresh = useCallback(() => {
    const store = webTrackStore();
    setTracks(readTracks(store));
    setMarked(readGuide(store));
    setIntroPlayed(localReelStore()?.getItem(INTRO_DAY_KEY) != null);
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
  const doneCount = guideSteps.filter((step) => stepDone(step.id, progress)).length;

  function openStep(id: (typeof guideSteps)[number]["id"]) {
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
      <ScrollView style={styles.fill} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 150 }} keyboardShouldPersistTaps="handled">
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
            <T variant="meta" color={colors.gold} style={styles.progress}>{doneCount} of {guideSteps.length} done</T>
            {next ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Happening next, ${next.title}`}
                onPress={() => router.push({ pathname: "/session/[id]", params: { id: next.id } })}
                style={styles.next}
              >
                <T variant="meta" color={colors.gold}>Happening next</T>
                <T variant="small" color={colors.foam} numberOfLines={1}>{next.title}</T>
                <T variant="meta" color={colors.foam} numberOfLines={2}>{sessionWhen(next, forum.timezone)} · {next.island}</T>
              </Pressable>
            ) : null}
            {guideSteps.map((step, index) => {
              const done = stepDone(step.id, progress);
              return (
                <FeedCard
                  key={step.id}
                  image={stepImage[step.id]}
                  alt={step.headline}
                  kicker={done ? "Done" : `Step ${index + 1} of ${guideSteps.length}`}
                  headline={step.headline}
                  line={step.line}
                  cta={done && step.id === "welcome" ? "Replay" : step.cta}
                  done={done}
                  onPress={() => openStep(step.id)}
                />
              );
            })}
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
      {welcome ? <Welcome start={welcomeStart} onClose={closeWelcome} /> : null}
      {deck ? <EssentialsDeck onClose={() => setDeck(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  fill: { flex: 1 },
  install: { marginHorizontal: 16, marginBottom: 8 },
  switch: { flexDirection: "row", alignSelf: "center", marginBottom: 14, padding: 4, borderRadius: 999, backgroundColor: "rgba(7,27,42,0.58)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)" },
  switchItem: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: colors.gold },
  progress: { marginLeft: 22, marginBottom: 10 },
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
