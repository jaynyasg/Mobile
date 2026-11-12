import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActionTile } from "@/components/ActionTile";
import { BeaconBackground } from "@/components/BeaconBackground";
import { CrystalMark } from "@/components/CrystalMark";
import { Glass } from "@/components/Glass";
import { PhotoShade } from "@/components/PhotoShade";
import { InstallHint } from "@/components/InstallHint";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
import { Welcome } from "@/components/Welcome";
import { useContent } from "@/content/provider";
import { forumPhase, suggestedDayId } from "@/logic/phase";
import { colors, sceneForIsland } from "@/theme";
import { hasSeenWelcome, markWelcomeSeen, webStorage } from "@/welcome";
import { Link } from "expo-router";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions, passes } = program;
  const phase = forumPhase(new Date());
  const dayId = suggestedDayId(new Date());
  const next = sessions
    .filter((session) => session.dayId === dayId && session.start)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const count = phase.phase === "upcoming" ? String(phase.daysUntil) : phase.phase === "live" ? "Now" : "Closed";
  const countCaption = phase.phase === "upcoming" ? (phase.daysUntil === 1 ? "day" : "days") : phase.phase === "live" ? "open" : "ended";
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome(webStorage())) setWelcome(true);
  }, []);

  function closeWelcome() {
    markWelcomeSeen(webStorage());
    setWelcome(false);
  }

  const actions = [
    { href: "/agenda" as const, icon: "calendar" as const, label: "Program", detail: forum.placeLabel },
    { href: "/places" as const, icon: "pin" as const, label: "Venues", detail: "Candidate places on each island" },
    { href: "/transport" as const, icon: "seat" as const, label: "Transport", detail: "Sample routes. Unconfirmed." },
    { href: "/stays" as const, icon: "pin" as const, label: "Stays", detail: "Where you stay" },
    { href: "/ticket" as const, icon: "ticket" as const, label: "Pass", detail: passes.previewLabel },
    { href: "/community" as const, icon: "chat" as const, label: "Community", detail: "Live chat" },
  ];

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <View style={[styles.install, { top: insets.top + 12 }]}>
        <InstallHint />
      </View>
      <ScrollView style={styles.fill} contentContainerStyle={{ paddingTop: insets.top + 72, paddingBottom: insets.bottom + 108 }} keyboardShouldPersistTaps="handled">
        <View pointerEvents="none" style={styles.mark}>
          <CrystalMark />
        </View>
        <Glass tone="dark" style={[styles.hero, { backgroundColor: "rgba(7,18,32,0.9)" }]}>
          <T variant="eyebrow" color={colors.gold}>{forum.kicker}</T>
          <T variant="display" foil>{forum.edition}</T>
          <T variant="small" color={colors.ivory}>{forum.dateLabel}</T>
          <T variant="body" color={colors.ivory}>{forum.placeLabel}</T>
          <View style={styles.countPill}>
            <T variant="title" color={colors.onDark}>{count}</T>
            <T variant="meta" color={colors.onDarkSoft}>{countCaption}</T>
          </View>
        </Glass>
        <View style={styles.start}>
          <T variant="eyebrow" color={colors.gold}>Start here</T>
        </View>
        <View style={styles.actions}>
          {actions.map((action) => (
            <ActionTile key={action.label} href={action.href} icon={action.icon} label={action.label} detail={action.detail} />
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="How it works" onPress={() => setWelcome(true)} style={styles.replay}>
          <T variant="small">How it works</T>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.islands}>
          {forum.pillars.map((pillar) => (
            <View key={pillar.id} style={styles.island}>
              <TappablePhoto source={sceneForIsland(pillar.island)} alt={`${pillar.name} on ${pillar.island}`} style={styles.islandPhoto} />
              <PhotoShade />
              <Link href={{ pathname: "/pillar/[id]", params: { id: pillar.id } }} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={pillar.name} style={styles.islandCopy}>
                  <T variant="rowTitle" color={colors.onDark}>{pillar.name}</T>
                  <T variant="meta" color={colors.gold}>{pillar.island}</T>
                </Pressable>
              </Link>
            </View>
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

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  fill: { flex: 1 },
  install: { position: "absolute", left: 16, zIndex: 2 },
  mark: { alignItems: "center", marginBottom: 12 },
  hero: { marginHorizontal: 16, gap: 6, paddingVertical: 18 },
  countPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(7,18,32,0.55)" },
  start: { alignSelf: "flex-start", marginLeft: 16, marginTop: 18, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(7,18,32,0.9)" },
  actions: { paddingHorizontal: 16, gap: 8 },
  replay: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", marginLeft: 16, marginTop: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "rgba(247,244,239,0.96)" },
  islands: { paddingHorizontal: 16, gap: 10, paddingTop: 8, paddingBottom: 14 },
  island: { width: 132, height: 168, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.45)" },
  islandPhoto: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  islandCopy: { padding: 10, gap: 2, zIndex: 1 },
  next: { marginHorizontal: 16, marginBottom: 8, padding: 14, gap: 4, borderRadius: 16, backgroundColor: "rgba(247,244,239,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(11,27,43,0.12)" },
  pressed: { opacity: 0.78 },
});
