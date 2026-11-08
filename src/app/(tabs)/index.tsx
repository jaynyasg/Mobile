import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { forum, scenes, stays } from "@/content";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { scenes as sceneImages } from "@/images";
import { forumPhase, phaseLabel, suggestedDayId } from "@/logic/phase";
import { colors, pad } from "@/theme";

export default function HomeScreen() {
  const phase = forumPhase(new Date());
  const scene = scenes[1] ?? scenes[0];

  return (
    <Screen statusBar="light" edge="none">
      <View style={styles.hero}>
        <Image source={sceneImages[scene.image]} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroShade} />
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
      </View>
      <View style={styles.notice}>
        <T variant="eyebrow">Proposed program</T>
        <T variant="small">{forum.draftNotice}</T>
        <T variant="meta">{scene.name}</T>
      </View>
      <T variant="eyebrow" style={styles.section}>
        Five pillars · planning homes
      </T>
      {forum.pillars.map((pillar) => (
        <Link key={pillar.id} href={{ pathname: "/pillar/[id]", params: { id: pillar.id } }} asChild>
          <Pressable accessibilityRole="button" style={styles.pillar}>
            <T variant="rowTitle">{pillar.name}</T>
            <T variant="meta">
              {pillar.island} · {pillar.region} · Proposed
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
        <HomeLink href="/ticket" label="Pass preview" detail="No payment collected" />
      </View>
    </Screen>
  );
}

function HomeLink({
  href,
  label,
  detail,
}: {
  href: "/transport" | "/stays" | "/ticket" | { pathname: "/agenda"; params: { day: string } };
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
  hero: { height: 320, justifyContent: "flex-end", overflow: "hidden" },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  heroShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(7,27,42,0.46)" },
  heroCopy: { padding: pad, paddingBottom: 22, gap: 6 },
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
