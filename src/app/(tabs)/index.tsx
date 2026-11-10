import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeaconBackground } from "@/components/BeaconBackground";
import { Glass } from "@/components/Glass";
import { InstallHint } from "@/components/InstallHint";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { forumPhase, phaseLabel, suggestedDayId } from "@/logic/phase";
import { sessionWhen } from "@/components/SessionRow";
import { colors } from "@/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions, stays, venues } = program;
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
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 168, paddingBottom: insets.bottom + 120, paddingHorizontal: 12 }} keyboardShouldPersistTaps="handled">
        <Glass tone="dark">
          <T variant="eyebrow" color={colors.gold}>{forum.name}</T>
          <T variant="display" color={colors.gold}>{forum.edition}</T>
          <T variant="small" color={colors.onDark}>{forum.dateLabel}</T>
          <T variant="meta" color={colors.onDarkSoft}>{forum.placeLabel}</T>
          <View style={styles.countRow}>
            <T variant="display" color={colors.onDark}>{count}</T>
            <T variant="small" color={colors.onDarkSoft}>{countCaption}</T>
          </View>
          <T variant="meta" color={colors.gold}>{phaseLabel(phase)}</T>
          {next ? (
            <Link href={{ pathname: "/session/[id]", params: { id: next.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.next}>
                <T variant="eyebrow" color={colors.gold}>Next session</T>
                <T variant="rowTitle" color={colors.onDark}>{next.title}</T>
                <T variant="meta" color={colors.onDarkSoft}>{sessionWhen(next)} · {next.island}</T>
              </Pressable>
            </Link>
          ) : null}
          <InstallHint tone="dark" />
        </Glass>
        <Glass tone="dark" style={styles.block}>
          <T variant="eyebrow" color={colors.gold}>Five pillars</T>
          {forum.pillars.map((pillar) => (
            <Link key={pillar.id} href={{ pathname: "/pillar/[id]", params: { id: pillar.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.link}>
                <T variant="rowTitle" color={colors.onDark}>{pillar.name}</T>
                <T variant="meta" color={colors.onDarkSoft}>{pillar.island} · {pillar.region}</T>
              </Pressable>
            </Link>
          ))}
        </Glass>
        <Glass tone="dark" style={styles.block}>
          <HomeLink href={{ pathname: "/agenda", params: { day: dayId } }} label="Program" detail="Day, pillar, island, type" />
          <HomeLink href="/transport" label="Sample transport" detail="Three unconfirmed routes" />
          <HomeLink href="/stays" label="Accommodations" detail={stays.brochureNote} />
          <HomeLink href={{ pathname: "/venue/[id]", params: { id: venues[0]?.id ?? "st-thomas" } }} label="Island stops" detail="Specific venue to be confirmed" />
          <HomeLink href="/ticket" label="Pass preview" detail="No payment collected" />
        </Glass>
      </ScrollView>
    </View>
  );
}

function HomeLink({
  href,
  label,
  detail,
}: {
  href: "/transport" | "/stays" | "/ticket" | { pathname: "/agenda"; params: { day: string } } | { pathname: "/venue/[id]"; params: { id: string } };
  label: string;
  detail: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" style={styles.link}>
        <T variant="rowTitle" color={colors.onDark}>{label}</T>
        <T variant="meta" color={colors.onDarkSoft}>{detail}</T>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  countRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 8 },
  next: { marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(201,162,74,0.45)", gap: 3 },
  block: { marginTop: 12 },
  link: { paddingVertical: 8, gap: 2 },
});
