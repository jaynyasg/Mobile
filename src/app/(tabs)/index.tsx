import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { BeaconBackground } from "@/components/BeaconBackground";
import { InstallHint } from "@/components/InstallHint";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { forumPhase, phaseLabel, suggestedDayId } from "@/logic/phase";
import { colors, pad } from "@/theme";

export default function HomeScreen() {
  const { program } = useContent();
  const { forum, stays, venues } = program;
  const phase = forumPhase(new Date());

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <Screen background="transparent" statusBar="light" edge="none">
        <View style={styles.heroCopy}>
          <T variant="eyebrow" color={colors.brassSoft}>
            {forum.name} · {forum.kicker}
          </T>
          <T variant="display" color={colors.ivory}>
            {forum.edition}
          </T>
          <T variant="small" color={colors.ivory}>
            {forum.dateLabel}
          </T>
          <T variant="meta" color={colors.muted}>
            {forum.placeLabel}
          </T>
          <T variant="meta" color={colors.brassSoft}>
            {phaseLabel(phase)}
          </T>
        </View>
      <View style={styles.sheet}>
      <InstallHint />
      <View style={styles.notice}>
        <T variant="eyebrow">Program</T>
        <T variant="small">{forum.draftNotice}</T>
        <T variant="meta">{forum.timingNote ? forum.timingNote.replace(/\b[Pp]roposed\s+/g, "") : "Specific venues and untimed activities remain to be confirmed."}</T>
      </View>
      <T variant="eyebrow" style={styles.section}>
        Five pillars · planning homes
      </T>
      {forum.pillars.map((pillar) => (
        <Link key={pillar.id} href={{ pathname: "/pillar/[id]", params: { id: pillar.id } }} asChild>
          <Pressable accessibilityRole="button" style={styles.pillar}>
            <T variant="rowTitle">{pillar.name}</T>
            <T variant="meta">
              {pillar.island} · {pillar.region}
            </T>
          </Pressable>
        </Link>
      ))}
      <T variant="eyebrow" style={styles.section}>
        Move through the draft
      </T>
      <View style={styles.links}>
        <HomeLink href={{ pathname: "/agenda", params: { day: suggestedDayId(new Date()) } }} label="Agenda" detail="Day, pillar, island, type" />
        <HomeLink href="/transport" label="Sample transport" detail="Three unconfirmed routes" />
        <HomeLink href="/stays" label="Accommodations" detail={stays.brochureNote} />
        <HomeLink href={{ pathname: "/venue/[id]", params: { id: venues[0]?.id ?? "st-thomas" } }} label="Venues" detail="Island stops · specific venue to be confirmed" />
        <HomeLink href="/ticket" label="Pass preview" detail="No payment collected" />
      </View>
      </View>
      </Screen>
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
        <T variant="rowTitle">{label}</T>
        <T variant="meta">{detail}</T>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071B2A" },
  heroCopy: { padding: pad, paddingTop: 72, paddingBottom: 22, gap: 6 },
  sheet: { backgroundColor: colors.paper, paddingTop: 8 },
  notice: { margin: pad, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised },
  section: { paddingHorizontal: pad, marginTop: 8, marginBottom: 8 },
  pillar: {
    marginHorizontal: pad,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    gap: 2,
  },
  links: { paddingHorizontal: pad, gap: 8, paddingBottom: 12 },
  link: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 2 },
});
