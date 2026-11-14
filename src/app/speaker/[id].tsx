import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { forum, panelistById, participationLabel, pillarById, sessionsForPanelist } from "@/content";
import { displayCopy } from "@/content/display";
import { joinLine } from "@/content/labels";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { Portrait } from "@/components/Portrait";
import { portraitFor } from "@/images";
import { sessionWhen } from "@/components/SessionRow";
import { useContent } from "@/content/provider";
import { colors } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function PanelistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useContent();
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
      <View style={styles.portrait}>
        <Portrait name={person.name} source={portraitFor(person.photo)} size={220} />
      </View>
      <View style={styles.pad}>
        {person.company ? <T variant="eyebrow" numberOfLines={2}>{person.company}</T> : null}
        <T variant="title" numberOfLines={3}>{person.name}</T>
        {person.title ? <T variant="small">{person.title}</T> : null}
        <T variant="meta" numberOfLines={3}>
          {joinLine([
            person.keynote ? "Keynote speaker" : "",
            pillar?.name || "Topic to be announced",
            person.proposedIsland || "Location TBC",
          ])}
        </T>
        {person.origin ? <T variant="meta">{person.origin}</T> : null}
        {person.bio ? <T variant="small">{displayCopy(person.bio)}</T> : null}
        <T variant="meta">The island is where these sessions are planned. The exact place is still to be confirmed.</T>
        <Link href={{ pathname: "/pillar/[id]", params: { id: person.proposedPillarId } }} asChild>
          <Pressable accessibilityRole="button">
            <T variant="small" color={colors.gold}>
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
            <T variant="eyebrow">{session.supplemental ? "Supplementary" : session.featured ? "Featured" : "Session"}</T>
            <T variant="rowTitle" numberOfLines={3}>{displayCopy(session.title)}</T>
            <T variant="meta" numberOfLines={2}>
              {joinLine([sessionWhen(session, forum.timezone), session.island])}
            </T>
            <T variant="meta">{participationLabel(session, person.id)}</T>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  portrait: { alignItems: "center", paddingTop: 18, paddingBottom: 8 },
  pad: { marginHorizontal: 12, marginTop: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  section: { marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, ...nightGlass },
  session: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
    gap: 4,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(11,27,43,0.12)",
    ...nightGlass,
  },
});
