import { Link, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { forum, panelistById, participationLabel, pillarById, sessionsForPanelist } from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { portraits } from "@/images";
import { formatRange } from "@/logic/time";
import { colors, pad } from "@/theme";

export default function PanelistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = panelistById(id ?? "");
  if (!person) {
    return (
      <Screen edge="none">
        <StackHeader title="Panelist" />
        <T variant="body" style={styles.pad}>This name is not on the roster.</T>
      </Screen>
    );
  }
  const pillar = pillarById(person.proposedPillarId);
  const linked = sessionsForPanelist(person.id);

  return (
    <Screen edge="none">
      <StackHeader title={person.name} />
      <Image source={portraits[person.photo]} style={styles.portrait} resizeMode="contain" accessibilityLabel={person.name} />
      <View style={styles.pad}>
        <T variant="eyebrow">{person.company}</T>
        <T variant="title">{person.name}</T>
        <T variant="small">{person.title}</T>
        <T variant="meta">
          Proposed pillar {pillar?.name} · {person.proposedIsland}
        </T>
        <T variant="meta">A proposed home is the first linked draft session. It is not a confirmed assignment or a venue.</T>
        <Link href={{ pathname: "/pillar/[id]", params: { id: person.proposedPillarId } }} asChild>
          <Pressable accessibilityRole="button">
            <T variant="small" color={colors.brass}>
              Open the {pillar?.name} island page
            </T>
          </Pressable>
        </Link>
      </View>
      <T variant="eyebrow" style={styles.section}>
        {linked.length} proposed session links
      </T>
      {linked.map((session) => (
        <Link key={session.id} href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
          <Pressable accessibilityRole="button" style={styles.session}>
            <T variant="eyebrow">{session.featured ? "Featured · Proposed" : "Proposed"}</T>
            <T variant="rowTitle">{session.title}</T>
            <T variant="meta">
              {formatRange(session.start, session.end, forum.timezone)} · {session.island}
            </T>
            <T variant="meta">{participationLabel(session, person.id)}</T>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  portrait: { height: 280, backgroundColor: colors.muted, marginHorizontal: pad },
  pad: { padding: pad, gap: 8 },
  section: { paddingHorizontal: pad },
  session: {
    marginHorizontal: pad,
    marginBottom: 8,
    padding: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
