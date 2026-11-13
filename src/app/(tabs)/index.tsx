import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { dockClearance } from "@/components/Dock";
import { BeaconBackground } from "@/components/BeaconBackground";
import { EssentialsDeck } from "@/components/EssentialsDeck";
import { FeedCard } from "@/components/FeedCard";
import { InstallHint } from "@/components/InstallHint";
import { Questions } from "@/components/Questions";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { useAuth } from "@/community/auth";
import { useContent } from "@/content/provider";
import { islandTrackLabel } from "@/content/labels";
import { reels, zoneReelIds, type ReelId } from "@/content/reels";
import { webTrackStore, writeTracks } from "@/guide/interests";
import { consumeIntakeRequest, readIntake, writeIntake, type IntakeRecord } from "@/logic/intake";
import { saveIntakeRemote } from "@/logic/intakeSync";
import { buildPath, PASS_ATTEND_URL, type PathStep } from "@/logic/pathPlan";
import { suggestedDayId } from "@/logic/phase";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { webStorage } from "@/welcome";

const stepPhoto: Record<PathStep["id"], string> = {
  pass: reels.pass.poster,
  sessions: reels.sessions.poster,
  stay: reels.stays.poster,
  route: reels.transport.poster,
  chat: reels.community.poster,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions, passes } = program;
  const router = useRouter();
  const { openChapter, replayIntro, openStory, reelActive } = useReels();
  const { userId, preview } = useAuth();
  const [mode, setMode] = useState<"you" | "explore">("you");
  const [deck, setDeck] = useState(false);
  const [asking, setAsking] = useState(false);
  const [intake, setIntake] = useState<IntakeRecord | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setIntake(readIntake(webStorage()));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(useCallback(() => {
    refresh();
    if (consumeIntakeRequest(webStorage())) setAsking(true);
  }, [refresh]));

  useEffect(() => {
    if (!ready || reelActive || asking) return;
    if (!readIntake(webStorage())) setAsking(true);
  }, [ready, reelActive, asking]);

  function storeAnswers(record: IntakeRecord) {
    const store = webStorage();
    writeIntake(store, record);
    writeTracks(webTrackStore(), [...record.areas]);
    setIntake(record);
    setAsking(false);
    if (userId && !preview) void saveIntakeRemote(userId, record);
  }

  function markStep(id: string) {
    if (!intake || intake.completed.includes(id)) return;
    storeAnswers({ ...intake, completed: [...intake.completed, id] });
  }

  function openStep(step: PathStep) {
    if (step.id !== "stay" || intake?.needsStay !== "booked") markStep(step.id);
    if (step.id === "pass") {
      if (intake?.hasPass === "have") openChapter("pass", "/passport");
      else Linking.openURL(passes.sourceUrl || PASS_ATTEND_URL).catch(() => undefined);
      return;
    }
    if (step.id === "sessions") openChapter("sessions", "/agenda");
    if (step.id === "stay") {
      const areas = intake?.areas.join(",") ?? "";
      router.push(areas && intake?.needsStay === "yes" ? { pathname: "/stays", params: { areas } } : "/stays");
    }
    if (step.id === "route") openChapter("transport", { pathname: "/transport", params: { build: "1" } });
    if (step.id === "chat") openChapter("community", "/community");
  }

  const dayId = suggestedDayId(new Date());
  const next = sessions
    .filter((session) => session.dayId === dayId && session.start)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const steps = intake ? buildPath(intake, forum.pillars, intake.completed) : [];

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: dockClearance(insets.bottom) + 48 }}
        keyboardShouldPersistTaps="handled"
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
              <T variant="headline" color={colors.foam}>Your path</T>
              <Pressable accessibilityRole="button" accessibilityLabel="What is TATEL" onPress={openStory} style={styles.what}>
                <T variant="button" color={colors.gold}>What is TATEL</T>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Retake questions" onPress={() => setAsking(true)} style={styles.retake}>
                <T variant="button" color={colors.foam}>Retake questions</T>
              </Pressable>
            </View>
            {steps.map((step, index) => (
              <Pressable key={step.id} accessibilityRole="button" accessibilityLabel={step.title} onPress={() => openStep(step)} style={styles.path}>
                <Image source={{ uri: stepPhoto[step.id] }} style={styles.pathPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                <View style={styles.pathShade} />
                <View style={styles.pathCopy}>
                  <T variant="meta" color={colors.gold}>{step.optional ? "Optional" : `Step ${index + 1}`}</T>
                  <T variant="rowTitle" color={colors.foam} numberOfLines={2}>{step.title}</T>
                  <T variant="meta" color={colors.foam} numberOfLines={2}>{step.line}</T>
                </View>
                {step.done ? <View style={styles.check}><T variant="button" color={colors.ink}>✓</T></View> : null}
              </Pressable>
            ))}
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
      {asking && !reelActive ? (
        <Questions
          onDone={(answers) => storeAnswers({ ...answers, completed: answers.needsStay === "booked" ? ["stay"] : [] })}
          onSkip={(answers) => storeAnswers({ ...answers, completed: answers.needsStay === "booked" ? ["stay"] : [] })}
        />
      ) : null}
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
  retake: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  path: { height: 148, marginHorizontal: 12, marginBottom: 12, borderRadius: 18, overflow: "hidden", justifyContent: "flex-end" },
  pathPhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  pathShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.45)" },
  pathCopy: { zIndex: 1, padding: 14, gap: 2 },
  check: { position: "absolute", top: 12, right: 12, zIndex: 2, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
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
