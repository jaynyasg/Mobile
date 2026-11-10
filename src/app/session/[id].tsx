import { Link, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { dayById, forum, panelistById, participationLabel, pillarById, placesForIsland, sessionById, venueById } from "@/content";
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
import { colors, pad, sceneForIsland } from "@/theme";

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
  const candidates = placesForIsland(session.island);
  const kind = session.supplemental ? "Supplementary" : session.featured ? "Featured" : "Session";

  return (
    <Screen edge="none" photo={sceneForIsland(session.island)}>
      <StackHeader title={day?.label} />
      <View style={styles.pad}>
        <T variant="eyebrow" color={colors.gold}>{session.optional ? `${kind} · Optional` : kind}</T>
        <T variant="title" color={colors.onDark}>{displayCopy(session.title)}</T>
        <T variant="meta" color={colors.onDarkSoft}>
          {pillar?.name} · {session.island} · {session.region}
        </T>
        <T variant="small" color={colors.onDark}>{sessionWhen(session)}</T>
        {timed && session.start && session.end ? (
          same ? (
            <T variant="meta" color={colors.onDarkSoft}>Same clock as this phone</T>
          ) : (
            <T variant="meta" color={colors.onDarkSoft}>{formatRange(session.start, session.end, local)} · your time</T>
          )
        ) : (
          <T variant="meta" color={colors.onDarkSoft}>No clock time yet.</T>
        )}
        <T variant="meta" color={colors.onDarkSoft}>
          {session.venue.specific || session.venue.label}
          {stay ? ` · ${stay.dock}` : ""}
        </T>
        <T variant="body" color={colors.onDark}>{displayCopy(session.description)}</T>
        <T variant="small" color={colors.onDarkSoft}>{displayCopy(session.outcome)}</T>
        {people.length === 0 ? <T variant="small" color={colors.onDark}>{SPEAKER_TBA}</T> : null}
        <View style={styles.actions}>
          {favored ? (
            <SecondaryButton label="Remove from My Schedule" onPress={() => dispatch({ type: "toggleFavorite", id: session.id })} />
          ) : (
            <PrimaryButton label="Save to My Schedule" onPress={() => dispatch({ type: "toggleFavorite", id: session.id })} />
          )}
        </View>
      </View>
      {candidates.map((place) => {
        const hero = place.photos.find((photo) => photo.hero) ?? place.photos[0];
        return (
          <Link key={place.id} href={{ pathname: "/venue/[id]", params: { id: place.id } }} asChild>
            <Pressable accessibilityRole="button" style={styles.place}>
              {hero ? <Image source={{ uri: hero.webp640 }} style={styles.placePhoto} accessibilityIgnoresInvertColors /> : null}
              <View style={styles.placeCopy}>
                <T variant="rowTitle" color={colors.onDark}>{place.name}</T>
              </View>
            </Pressable>
          </Link>
        );
      })}
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
  pad: { paddingHorizontal: 22, paddingTop: 36, gap: 10, paddingBottom: 18 },
  actions: { marginTop: 8, alignSelf: "flex-start" },
  place: { marginHorizontal: 22, marginBottom: 12, height: 150, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end" },
  placePhoto: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  placeCopy: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: "rgba(6,14,24,0.35)" },
});
