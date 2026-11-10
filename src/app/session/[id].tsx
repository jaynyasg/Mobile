import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { dayById, forum, panelistById, participationLabel, pillarById, sessionById, venueById } from "@/content";
import { displayCopy, SPEAKER_TBA } from "@/content/display";
import { PersonRow } from "@/components/PersonRow";
import { sessionWhen } from "@/components/SessionRow";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { portraits } from "@/images";
import { deviceTimeZone, formatRange, sameClock } from "@/logic/time";
import { useContent } from "@/content/provider";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useContent();
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
  const timed = Boolean(session.start && session.end);
  const same = timed && session.start ? sameClock(session.start, forum.timezone, local) : true;
  const people = session.speakerIds;
  const stay = session.venue.venueId ? venueById(session.venue.venueId) : undefined;
  const kind = session.supplemental ? "Supplementary" : session.featured ? "Featured" : "Session";

  return (
    <Screen edge="none">
      <StackHeader title={day?.label} />
      <View style={styles.pad}>
        <T variant="eyebrow">{session.optional ? `${kind} · Optional` : kind}</T>
        <T variant="title">{displayCopy(session.title)}</T>
        <T variant="meta">
          {pillar?.name} · {session.island} · {session.region}
        </T>
        <T variant="small">{sessionWhen(session)}</T>
        {timed && session.start && session.end ? (
          same ? (
            <T variant="meta">Same clock as this phone</T>
          ) : (
            <T variant="meta">{formatRange(session.start, session.end, local)} · your time</T>
          )
        ) : (
          <T variant="meta">No clock time yet.</T>
        )}
        <T variant="meta">
          Venue: {session.venue.specific || session.venue.label}
          {stay ? ` · ${stay.dock}` : ""}
        </T>
        <T variant="body">{displayCopy(session.description)}</T>
        <T variant="small">What we’ll work on: {displayCopy(session.outcome)}</T>
        <T variant="meta">Format: {displayCopy(session.format)}</T>
        {session.phase ? <T variant="meta">Phase: {displayCopy(session.phase)}</T> : null}
        {session.specialists ? <T variant="meta">Related expertise: {displayCopy(session.specialists)}</T> : null}
        {people.length === 0 ? <T variant="small">{SPEAKER_TBA}</T> : null}
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
            photo={person.photo ? portraits[person.photo] : undefined}
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
