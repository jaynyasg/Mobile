import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActionTile } from "@/components/ActionTile";
import { BeaconBackground } from "@/components/BeaconBackground";
import { CrystalMark } from "@/components/CrystalMark";
import { Glass } from "@/components/Glass";
import { PhotoShade } from "@/components/PhotoShade";
import { InstallHint } from "@/components/InstallHint";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { Welcome } from "@/components/Welcome";
import { REEL_FALLBACK_POSTER, reels, zoneReelIds, type ReelId } from "@/content/reels";
import { useContent } from "@/content/provider";
import { forumPhase, suggestedDayId } from "@/logic/phase";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { hasSeenWelcome, markWelcomeSeen, webStorage } from "@/welcome";
import { Link, useIsFocused } from "expo-router";
import { nightGlass } from "@/components/nightGlass";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const phase = forumPhase(new Date());
  const dayId = suggestedDayId(new Date());
  const next = sessions
    .filter((session) => session.dayId === dayId && session.start)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const count = phase.phase === "upcoming" ? String(phase.daysUntil) : phase.phase === "live" ? "Now" : "Closed";
  const countCaption = phase.phase === "upcoming" ? (phase.daysUntil === 1 ? "day" : "days") : phase.phase === "live" ? "open" : "ended";
  const focused = useIsFocused();
  const { openChapter, replayIntro, exploredVersion } = useReels();
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome(webStorage())) setWelcome(true);
  }, []);

  function closeWelcome() {
    markWelcomeSeen(webStorage());
    setWelcome(false);
  }

  const actions = [
    { href: "/agenda" as const, icon: "calendar" as const, label: "Sessions", detail: "Speakers and your schedule", reelId: "sessions" as const },
    { href: "/places" as const, icon: "pin" as const, label: "Venues", detail: "Candidate places on each island", reelId: "venues" as const },
    { href: "/transport" as const, icon: "seat" as const, label: "Transport", detail: "Sample routes. Unconfirmed.", reelId: "transport" as const },
    { href: "/stays" as const, icon: "pin" as const, label: "Stays", detail: "Resorts & where to sleep", reelId: "stays" as const },
    { href: "/ticket" as const, icon: "ticket" as const, label: "Pass", detail: "Your event pass (preview, no payment)", reelId: "pass" as const },
    { href: "/community" as const, icon: "chat" as const, label: "Community", detail: "Live chat", reelId: "community" as const },
  ];

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView style={styles.fill} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 108 }} keyboardShouldPersistTaps="handled">
        <View style={styles.install}>
          <InstallHint />
        </View>
        <View pointerEvents="none" style={styles.mark}>
          <CrystalMark />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Explore the welcome guide" onPress={() => setWelcome(true)}>
          <Glass tone="dark" style={styles.hero}>
            <T variant="eyebrow" color={colors.gold}>{forum.edition}</T>
            <T variant="title">{forum.kicker}</T>
            <T variant="small" color={colors.foam}>{forum.dateLabel}</T>
            <T variant="body" color={colors.foam}>{forum.placeLabel}</T>
            <View style={styles.countPill}>
              <T variant="title" color={colors.onDark}>{count}</T>
              <T variant="meta" color={colors.onDarkSoft}>{countCaption}</T>
            </View>
            <View style={styles.explore}>
              <T variant="small" color={colors.gold}>Explore</T>
              <Icon name="chevron" size={18} color={colors.gold} />
            </View>
          </Glass>
        </Pressable>
        <View style={styles.start}>
          <T variant="eyebrow" color={colors.gold}>Start here</T>
        </View>
        <View style={styles.actions}>
          {actions.map((action) => (
            <ActionTile key={action.label} href={action.href} icon={action.icon} label={action.label} detail={action.detail} reelId={action.reelId} />
          ))}
        </View>
        <View style={styles.replays}>
          <Pressable accessibilityRole="button" accessibilityLabel="How it works" onPress={() => setWelcome(true)} style={styles.replay}>
            <T variant="small">How it works</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Replay intro" onPress={replayIntro} style={styles.replay}>
            <T variant="small">Replay intro</T>
          </Pressable>
        </View>
        <View style={styles.start}>
          <T variant="eyebrow" color={colors.gold}>Islands to explore</T>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.islands}>
          {forum.pillars.map((pillar) => {
            const explored = isExplored(localReelStore(), pillar.id);
            const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
            return (
              <Pressable
                key={`${pillar.id}-${exploredVersion}-${focused ? "on" : "off"}`}
                accessibilityRole="button"
                accessibilityLabel={`${pillar.island}, ${pillar.name}${explored ? ", explored" : ""}`}
                onPress={() => {
                  if (zoneId) openChapter(zoneId, { pathname: "/pillar/[id]", params: { id: pillar.id } });
                }}
                style={styles.island}
              >
                <Image source={{ uri: sceneForIsland(pillar.island) }} style={styles.islandPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                <PhotoShade />
                {explored ? (
                  <View style={styles.explored}>
                    <T variant="meta" color={colors.ink}>Explored</T>
                  </View>
                ) : null}
                <View style={styles.islandCopy}>
                  <T variant="rowTitle" color={colors.onDark}>{pillar.island}</T>
                  <T variant="meta" color={colors.gold}>{pillar.name}</T>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.start}>
          <T variant="eyebrow" color={colors.gold}>Reels</T>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.islands}>
          {zoneReelIds.map((id) => (
            <ReelPreview key={id} id={id} onPress={() => openChapter(id, { pathname: "/pillar/[id]", params: { id } })} />
          ))}
        </ScrollView>
        {next ? (
          <Link href={{ pathname: "/session/[id]", params: { id: next.id } }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={next.title} style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.next}>
                <T variant="eyebrow" color={colors.gold}>Next</T>
                <T variant="rowTitle" numberOfLines={2}>{next.title}</T>
                <T variant="meta">{sessionWhen(next)} · {next.island}</T>
              </View>
            </Pressable>
          </Link>
        ) : null}
      </ScrollView>
      {welcome ? <Welcome onClose={closeWelcome} /> : null}
    </View>
  );
}

function ReelPreview({ id, onPress }: { id: ReelId; onPress: () => void }) {
  const reel = reels[id];
  const [poster, setPoster] = useState<string>(reel.poster);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${reel.title} reel`} onPress={onPress} style={styles.reel}>
      <Image
        source={{ uri: poster }}
        onError={() => setPoster(REEL_FALLBACK_POSTER)}
        style={styles.islandPhoto}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <PhotoShade />
      <View style={styles.islandCopy}>
        <T variant="meta" color={colors.gold}>{reel.kicker}</T>
        <T variant="rowTitle" color={colors.onDark} numberOfLines={2}>{reel.title}</T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  fill: { flex: 1 },
  install: { marginHorizontal: 16, marginBottom: 8 },
  mark: { alignItems: "center", marginBottom: 12 },
  hero: { marginHorizontal: 16, gap: 6, paddingVertical: 18 },
  explore: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, minHeight: 44 },
  countPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.58)" },
  start: { alignSelf: "flex-start", marginLeft: 16, marginTop: 18, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(7,27,42,0.58)" },
  actions: { paddingHorizontal: 16, gap: 8 },
  replays: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: 16, marginTop: 8 },
  replay: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 999, ...nightGlass },
  islands: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 14 },
  island: { width: 148, height: 188, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)" },
  reel: { width: 148, height: 188, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)" },
  explored: { position: "absolute", top: 8, left: 8, zIndex: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.gold },
  islandPhoto: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  islandCopy: { padding: 10, gap: 2, zIndex: 1 },
  next: { marginHorizontal: 16, marginBottom: 8, padding: 14, gap: 4, borderRadius: 16, ...nightGlass },
  pressed: { opacity: 0.78 },
});
