import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeaconBackground } from "@/components/BeaconBackground";
import { EssentialsDeck } from "@/components/EssentialsDeck";
import { FeedCard } from "@/components/FeedCard";
import { InstallHint } from "@/components/InstallHint";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { Welcome } from "@/components/Welcome";
import { useContent } from "@/content/provider";
import { markUnlockSeen, readTracks, unlockSeen, webTrackStore } from "@/guide/interests";
import { forumPhase, suggestedDayId } from "@/logic/phase";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { colors, sceneForIsland } from "@/theme";
import { hasSeenWelcome, markWelcomeSeen, webStorage } from "@/welcome";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const router = useRouter();
  const { openChapter, replayIntro } = useReels();
  const [mode, setMode] = useState<"you" | "explore">("you");
  const [welcome, setWelcome] = useState(false);
  const [welcomeStart, setWelcomeStart] = useState<"arrival" | "tracks">("arrival");
  const [deck, setDeck] = useState(false);
  const [tracks, setTracks] = useState<string[]>([]);
  const [seenUnlock, setSeenUnlock] = useState(true);
  const phase = forumPhase(new Date());
  const dayId = suggestedDayId(new Date());

  useEffect(() => {
    const store = webTrackStore();
    setTracks(readTracks(store));
    setSeenUnlock(unlockSeen(store));
    if (!hasSeenWelcome(webStorage())) {
      setWelcomeStart("arrival");
      setWelcome(true);
    }
  }, []);

  function closeWelcome() {
    markWelcomeSeen(webStorage());
    const store = webTrackStore();
    setTracks(readTracks(store));
    setSeenUnlock(unlockSeen(store));
    setWelcome(false);
  }

  const chosen = tracks.length ? forum.pillars.filter((pillar) => tracks.includes(pillar.id)) : forum.pillars;
  const next = sessions
    .filter((session) => session.dayId === dayId && session.start && (tracks.length === 0 || tracks.includes(session.pillarId)))
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const showUnlock = tracks.length > 0 && !seenUnlock;

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView style={styles.fill} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
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
            {showUnlock ? (
              <FeedCard
                image={sceneForIsland(chosen[0]?.island)}
                alt="Open water"
                kicker="Unlocked"
                headline="Your islands are open"
                line={chosen.map((pillar) => pillar.name).join(" · ")}
                cta="See them"
                onPress={() => {
                  markUnlockSeen(webTrackStore());
                  setSeenUnlock(true);
                  setMode("explore");
                }}
              />
            ) : null}
            {tracks.length === 0 ? (
              <FeedCard
                image={sceneForIsland(forum.pillars[0]?.island)}
                alt="The coast"
                kicker={forum.edition}
                headline="Choose your tracks"
                line="Tech, AI, travel, entertainment, or law."
                cta="Continue"
                onPress={() => {
                  setWelcomeStart("tracks");
                  setWelcome(true);
                }}
              />
            ) : null}
            <FeedCard
              image={sceneForIsland("St. John")}
              alt="Island water"
              kicker={phase.phase === "live" ? "Today" : forum.dateLabel}
              headline={next ? next.title : "Need to know"}
              line={next ? `${sessionWhen(next, forum.timezone)} · ${next.island}` : "Passports, boats, sun, and the clock."}
              cta={next ? "Open" : "Open"}
              onPress={() => {
                if (next) router.push({ pathname: "/session/[id]", params: { id: next.id } });
                else setDeck(true);
              }}
            />
            <FeedCard
              image={sceneForIsland("St. Thomas")}
              alt="A harbor"
              kicker="Before you fly"
              headline="Need to know"
              line="Short cards. Check anything that can change."
              cta="Open"
              onPress={() => setDeck(true)}
            />
            {chosen.map((pillar) => {
              const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
              const explored = isExplored(localReelStore(), pillar.id);
              return (
                <FeedCard
                  key={pillar.id}
                  image={sceneForIsland(pillar.island)}
                  alt={pillar.island}
                  kicker={explored ? "Explored" : "For you"}
                  headline={pillar.island}
                  line={pillar.name}
                  cta="Enter"
                  onPress={() => {
                    if (zoneId) openChapter(zoneId, { pathname: "/pillar/[id]", params: { id: pillar.id } });
                  }}
                />
              );
            })}
          </>
        ) : (
          forum.pillars.map((pillar) => {
            const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
            const explored = isExplored(localReelStore(), pillar.id);
            return (
              <FeedCard
                key={pillar.id}
                image={sceneForIsland(pillar.island)}
                alt={pillar.island}
                kicker={explored ? "Explored" : "A zone"}
                headline={pillar.island}
                line={pillar.name}
                cta="Enter"
                onPress={() => {
                  if (zoneId) openChapter(zoneId, { pathname: "/pillar/[id]", params: { id: pillar.id } });
                }}
              />
            );
          })
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Replay intro" onPress={replayIntro} style={styles.replay}>
          <T variant="meta" color={colors.gold}>Replay arrival</T>
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
  replay: { alignSelf: "center", minHeight: 44, justifyContent: "center", marginBottom: 12 },
});
