import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { dayById, forum, panelistById, panelistNames, participationLabel, pillarById, sessionById } from "@/content";
import { PersonRow } from "@/components/PersonRow";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { portraits } from "@/images";
import { deviceTimeZone, formatRange, sameClock } from "@/logic/time";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = sessionById(id ?? "");
  const { state, dispatch } = useApp();
  if (!session) {
    return (
      <Screen edge="none">
        <StackHeader title="Session" />
        <T variant="body" style={styles.pad}>This session is not in the draft.</T>
      </Screen>
    );
  }
  const day = dayById(session.dayId);
  const pillar = pillarById(session.pillarId);
  const favored = state.favoriteIds.includes(session.id);
  const local = deviceTimeZone();
  const same = sameClock(session.start, forum.timezone, local);
  const people = session.featured ? session.candidateIds : session.speakerIds;

  return (
    <Screen edge="none">
      <StackHeader title={day?.label} />
      <View style={styles.pad}>
        <T variant="eyebrow">{session.featured ? "Featured · Proposed" : "Proposed session"}</T>
        <T variant="title">{session.title}</T>
        <T variant="meta">
          {pillar?.name} · {session.island} · {session.region}
        </T>
        <T variant="small">{formatRange(session.start, session.end, forum.timezone)}</T>
        {same ? (
          <T variant="meta">Same clock as this phone</T>
        ) : (
          <T variant="meta">{formatRange(session.start, session.end, local)} · your time</T>
        )}
        <T variant="meta">Venue unconfirmed. Status: {session.status}.</T>
        <T variant="body">{session.description}</T>
        <T variant="small">Intended output: {session.outcome}</T>
        <T variant="meta">Format: {session.format}</T>
        <T variant="meta">Phase: {session.phase}</T>
        {session.specialists ? <T variant="meta">Additional expertise to invite: {session.specialists}</T> : null}
        {session.featured ? <T variant="small">{forum.featuredStaffing}</T> : null}
        <T variant="meta">
          {session.featured ? "Potential contributors" : "Suggested panelists"}: {panelistNames(people) || "None listed"}
        </T>
        <View style={styles.actions}>
          {favored ? (
            <SecondaryButton label="Remove from My Schedule" onPress={() => dispatch({ type: "toggleFavorite", id: session.id })} />
          ) : (
            <PrimaryButton label="Save to My Schedule" onPress={() => dispatch({ type: "toggleFavorite", id: session.id })} />
          )}
        </View>
      </View>
      {people.map((personId) => {
        const person = panelistById(personId);
        if (!person) return null;
        const role = participationLabel(session, person.id);
        return (
          <PersonRow
            key={person.id}
            name={person.name}
            photo={portraits[person.photo]}
            meta={`${role ?? ""}\n${person.title} · ${person.company}`}
            href={{ pathname: "/speaker/[id]", params: { id: person.id } }}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: pad, gap: 8, paddingBottom: 12 },
  actions: { marginTop: 8 },
});
