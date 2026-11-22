import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { dockClearance } from "@/components/Dock";
import { scrollPort } from "@/components/scrollPort";
import { notchPadding } from "@/components/notch";
import { BeaconBackground } from "@/components/BeaconBackground";
import { nightGlass } from "@/components/nightGlass";
import { EssentialsDeck } from "@/components/EssentialsDeck";
import { ExperienceInvitation, ExperiencePreview } from "@/components/ExperienceInvitation";
import { FeedCard } from "@/components/FeedCard";
import { InstallHint } from "@/components/InstallHint";
import { PlanTrail } from "@/components/PlanTrail";
import { Questions } from "@/components/Questions";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { useAuth } from "@/community/auth";
import { useContent } from "@/content/provider";
import { islandTrackLabel } from "@/content/labels";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { readTracks, webTrackStore, writeTracks } from "@/guide/interests";
import { consumeIntakeRequest, readIntake, writeIntake, type IntakeRecord } from "@/logic/intake";
import { saveIntakeRemote } from "@/logic/intakeSync";
import { readOwnedPass } from "@/logic/ownedPass";
import { buildPath, pathDestination, type PathStep } from "@/logic/pathPlan";
import { suggestedDayId } from "@/logic/phase";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { webStorage } from "@/welcome";
import { useApp } from "@/store";
import { takeEntryIntent, type EntryIntent } from "@/logic/entryIntent";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const router = useRouter();
  const { state } = useApp();
  const { openChapter, replayIntro, openStory, reelActive } = useReels();
  const { userId, preview } = useAuth();
  const [mode, setMode] = useState<"you" | "explore">("you");
  const [deck, setDeck] = useState(false);
  const [asking, setAsking] = useState(false);
  const [entryIntent, setEntryIntent] = useState<EntryIntent | null>(null);
  const [intake, setIntake] = useState<IntakeRecord | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setIntake(readIntake(webStorage()));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOwned = () => refresh();
    window.addEventListener("tatel-pass-owned", onOwned);
    window.addEventListener("tatel-intake-changed", onOwned);
    return () => { window.removeEventListener("tatel-pass-owned", onOwned); window.removeEventListener("tatel-intake-changed", onOwned); };
  }, [refresh]);

  useFocusEffect(useCallback(() => {
    refresh();
    if (consumeIntakeRequest(webStorage())) { setEntryIntent(null); setAsking(true); }
  }, [refresh]));

  useEffect(() => {
    if (!ready || reelActive) return;
    const intent = takeEntryIntent(webStorage());
    if (intent === "explore") {
      if (!readIntake(webStorage())) writeIntake(webStorage(), { hasPass: "skipped", needsStay: "skipped", areas: readTracks(webTrackStore()), interests: [], completed: [] });
      setAsking(false);
      router.navigate("/explore");
      return;
    }
    if (intent) { setEntryIntent(intent); setAsking(true); return; }
    if (asking) return;
    if (!readIntake(webStorage())) setAsking(true);
  }, [ready, reelActive, asking]);

  function storeAnswers(record: IntakeRecord, navigate = true) {
    const store = webStorage();
    writeIntake(store, record);
    writeTracks(webTrackStore(), [...record.areas]);
    setIntake(record);
    setAsking(false);
    setEntryIntent(null);
    if (userId && !preview) void saveIntakeRemote(userId, record);
    if (!navigate) return;
    const steps = buildPath(record, forum.pillars, { completed: record.completed, ownedPass: readOwnedPass(store) != null, ownedTier: readOwnedPass(store), savedSessionCount: state.favoriteIds.length });
    const first = steps.find((step) => !step.done);
    if (!first) return;
    const target = pathDestination(first.id, record);
    if (target.pathname === "/tickets") {
      if (target.params && "checkout" in target.params) router.navigate(target);
      else openChapter("pass", target);
    }
    else if (target.pathname === "/agenda") openChapter("sessions", target);
    else if (target.pathname === "/stays") {
      const areas = target.params && "areas" in target.params ? target.params.areas : "";
      openChapter("stays", areas ? { pathname: "/stays", params: { areas } } : "/stays");
    }
    else router.push(target);
  }

  function openStep(step: PathStep) {
    if (step.id === "pass" && step.done) {
      router.navigate("/tickets");
      return;
    }
    const target = pathDestination(step.id, {
      areas: intake?.areas ?? [],
      needsStay: intake?.needsStay ?? "skipped",
      ticketPreference: intake?.ticketPreference,
    });
    if (target.pathname === "/tickets") {
      if (target.params && "checkout" in target.params) router.navigate(target);
      else openChapter("pass", target);
      return;
    }
    if (target.pathname === "/agenda") {
      openChapter("sessions", "/agenda");
      return;
    }
    if (target.pathname === "/stays") {
      const areas = target.params && "areas" in target.params ? target.params.areas : "";
      openChapter("stays", areas ? { pathname: "/stays", params: { areas } } : "/stays");
      return;
    }
    if (target.pathname === "/routes") {
      router.push({ pathname: "/routes", params: { build: "1" } });
      return;
    }
    if (target.pathname === "/explore") router.push("/explore");
    else openChapter("community", "/community");
  }

  const dayId = suggestedDayId(new Date());
  const next = sessions
    .filter((session) => session.dayId === dayId && session.start)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const steps = intake
    ? buildPath(intake, forum.pillars, { completed: intake.completed, ownedPass: readOwnedPass(webStorage()) != null, ownedTier: readOwnedPass(webStorage()), savedSessionCount: state.favoriteIds.filter((id) => sessions.some((session) => session.id === id)).length })
    : [];

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView
        style={[scrollPort, { marginBottom: dockClearance(insets.bottom) }]}
        contentContainerStyle={[{ paddingBottom: 28 }, notchPadding("top", 8, insets.top)]}
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
              <T variant="eyebrow" color={colors.gold}>Your next chapter</T>
              <T variant="title" color={colors.foam}>{steps.length ? "Your island itinerary." : "Make it yours."}</T>
              <T variant="small" color={colors.foam}>Based on your choices. Take your next step when you're ready.</T>
              <View style={styles.pills}>
                <Pressable accessibilityRole="button" accessibilityLabel="Retake questions" onPress={() => { setEntryIntent(null); setAsking(true); }} style={styles.retake}>
                  <T variant="button" color={colors.foam}>{intake ? "Edit my plan" : "Plan my visit"}</T>
                </Pressable>
              </View>
            </View>
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}><PlanTrail steps={steps} onOpen={openStep} /></View>
            <ExperienceInvitation onStory={openStory} />
            <ExperiencePreview />
            {next ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`From the program, ${next.title}`}
                onPress={() => router.push({ pathname: "/session/[id]", params: { id: next.id } })}
                style={styles.next}
              >
                <T variant="meta" color={colors.gold}>From the program</T>
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
          key={entryIntent ?? "questions"}
          initial={entryIntent ? { areas: readTracks(webTrackStore()), ...intake, hasPass: entryIntent === "stay" ? "have" : "not-yet", ticketPreference: readOwnedPass(webStorage()) ?? intake?.ticketPreference } : intake ? undefined : { areas: readTracks(webTrackStore()) }}
          startAt={entryIntent ? 1 : 0}
          onDone={(answers) => storeAnswers({ ...answers, completed: answers.needsStay === "booked" ? ["stay"] : [] })}
          onSkip={(answers) => storeAnswers({ ...answers, interests: answers.interests ?? [], completed: answers.needsStay === "booked" ? ["stay"] : [] }, false)}
        />
      ) : null}
      {deck ? <EssentialsDeck onClose={() => setDeck(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, minHeight: 0, backgroundColor: "#071421" },
  install: { marginHorizontal: 16, marginBottom: 4 },
  switch: { flexDirection: "row", alignSelf: "center", marginBottom: 8, padding: 4, borderRadius: 999, backgroundColor: "rgba(7,27,42,0.58)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)" },
  switchItem: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: colors.gold },
  guideHead: { marginHorizontal: 16, marginBottom: 8, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  retake: {
    ...nightGlass,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,27,42,0.88)",
  },
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
  replay: { alignSelf: "center", minHeight: 44, justifyContent: "center", marginBottom: 12, paddingHorizontal: 16, borderRadius: 999, ...nightGlass },
});
