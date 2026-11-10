import { Link } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeaconBackground } from "@/components/BeaconBackground";
import { PhotoShade } from "@/components/PhotoShade";
import { InstallHint } from "@/components/InstallHint";
import { sessionWhen } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { forumPhase, suggestedDayId } from "@/logic/phase";
import { colors, sceneForIsland } from "@/theme";

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

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <View style={[styles.install, { top: insets.top + 12 }]}>
        <InstallHint />
      </View>
      <View style={[styles.lower, { bottom: insets.bottom + 86 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.islands}>
          {forum.pillars.map((pillar) => (
            <Link key={pillar.id} href={{ pathname: "/pillar/[id]", params: { id: pillar.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.island}>
                <Image source={{ uri: sceneForIsland(pillar.island).replace("-1280.webp", "-640.webp") }} style={styles.islandPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                <PhotoShade />
                <View style={styles.islandCopy}>
                  <T variant="rowTitle" color={colors.onDark}>{pillar.name}</T>
                  <T variant="meta" color={colors.gold}>{pillar.island}</T>
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
        <View style={styles.copy}>
          <T variant="display" color={colors.gold}>{forum.edition}</T>
          <T variant="small" color={colors.onDark}>{forum.dateLabel}</T>
          <View style={styles.countRow}>
            <T variant="title" color={colors.onDark}>{count}</T>
            <T variant="meta" color={colors.onDarkSoft}>{countCaption}</T>
          </View>
          {next ? (
            <Link href={{ pathname: "/session/[id]", params: { id: next.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.next}>
                <T variant="eyebrow" color={colors.gold}>Next</T>
                <T variant="small" color={colors.onDark} numberOfLines={1}>{next.title}</T>
                <T variant="meta" color={colors.onDarkSoft}>{sessionWhen(next)} · {next.island}</T>
              </Pressable>
            </Link>
          ) : null}
          <View style={styles.links}>
            <HomeLink href="/transport" label="Transport" />
            <HomeLink href="/stays" label="Stays" />
            <HomeLink href="/ticket" label="Pass" />
          </View>
        </View>
      </View>
    </View>
  );
}

function HomeLink({ href, label }: { href: "/transport" | "/stays" | "/ticket"; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button">
        <T variant="meta" color={colors.gold}>{label}</T>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  install: { position: "absolute", left: 16 },
  lower: { position: "absolute", left: 0, right: 0 },
  islands: { paddingHorizontal: 16, gap: 10, paddingBottom: 14 },
  island: { width: 132, height: 168, borderRadius: 14, overflow: "hidden", justifyContent: "flex-end" },
  islandPhoto: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  islandCopy: { padding: 10, gap: 2 },
  copy: { paddingHorizontal: 22, gap: 2 },
  countRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 4 },
  next: { marginTop: 10, gap: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(201,162,74,0.55)", paddingTop: 8 },
  links: { flexDirection: "row", gap: 18, marginTop: 10 },
});
