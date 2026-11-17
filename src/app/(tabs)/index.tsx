import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { readOwnedPass } from "@/logic/ownedPass";
import { buildPath, pathDestination, type PathStep } from "@/logic/pathPlan";
import { suggestedDayId } from "@/logic/phase";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { webStorage } from "@/welcome";
import { useApp } from "@/store";
import { takeEntryIntent, type EntryIntent } from "@/logic/entryIntent";

const stepPhoto: Record<PathStep["id"], string> = {
  pass: reels.pass.poster,
  sessions: reels.sessions.poster,
  stay: reels.stays.poster,
  route: reels.transport.poster,
  chat: reels.community.poster,
  explore: reels.venues.poster,
};

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
      if (!readIntake(webStorage())) writeIntake(webStorage(), { hasPass: "skipped", needsStay: "skipped", areas: [], interests: [], completed: [] });
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
            <ExperienceInvitation onStory={openStory} />
            <View style={styles.guideHead}>
              <T variant="eyebrow" color={colors.gold}>Your next chapter</T>
              <T variant="title" color={colors.foam}>Make it yours.</T>
              <T variant="small" color={colors.foam}>Choose how you'll arrive, where you'll wake up, and what you'll help bring to life. We'll guide the details. You bring the curiosity.</T>
              <View style={styles.pills}>
                <Pressable accessibilityRole="button" accessibilityLabel="Retake questions" onPress={() => { setEntryIntent(null); setAsking(true); }} style={styles.retake}>
                  <T variant="button" color={colors.foam}>Reshape my experience</T>
                </Pressable>
              </View>
            </View>
            {steps.map((step) => (
              <Pressable key={step.id} accessibilityRole="button" accessibilityState={{ checked: step.done }} accessibilityLabel={step.done ? `${step.title}, completed` : step.title} onPress={() => openStep(step)} style={styles.path}>
                <Image source={{ uri: stepPhoto[step.id] }} style={styles.pathPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                <View style={styles.pathShade} />
                <View style={styles.pathCopy}>
                  <T variant="meta" color={colors.gold} style={styles.stepLabel}>{`Chapter ${step.number}`}</T>
                  <T variant="rowTitle" color={colors.foam} numberOfLines={1} style={styles.stepTitle}>{step.title}</T>
                  <T variant="meta" color={colors.foam} numberOfLines={1} style={styles.stepLine}>{step.line}</T>
                </View>
                {step.done ? (
                  <View style={styles.doneMark} accessibilityElementsHidden>
                    <T variant="button" color={colors.ink}>✓</T>
                  </View>
                ) : null}
              </Pressable>
            ))}
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
          initial={entryIntent ? { ...intake, hasPass: entryIntent === "stay" ? "have" : "not-yet", ticketPreference: readOwnedPass(webStorage()) ?? intake?.ticketPreference } : undefined}
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
  path: { position: "relative", minHeight: 104, marginHorizontal: 16, marginBottom: 10, borderRadius: 8, overflow: "hidden", justifyContent: "center" },
  pathPhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  pathShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.62)" },
  pathCopy: { zIndex: 1, paddingHorizontal: 18, paddingRight: 48, paddingVertical: 18, gap: 5 },
  doneMark: {
    position: "absolute",
    right: 10,
    top: 18,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  stepLabel: { fontSize: 11, lineHeight: 14 },
  stepTitle: { fontSize: 16, lineHeight: 20 },
  stepLine: { fontSize: 15, lineHeight: 21 },
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
