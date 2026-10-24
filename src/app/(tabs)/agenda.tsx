import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { forum, sessions, speakers } from "@/content";
import type { TrackId } from "@/content/types";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { SessionRow } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { Chip, EmptyState, PageHeader } from "@/components/ui";
import { AgendaLens, filterAgenda } from "@/logic/agenda";
import { suggestedDayId } from "@/logic/phase";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";

const lenses: { id: AgendaLens; label: string }[] = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "seats", label: "Seats" },
];

export default function AgendaScreen() {
  const { state } = useApp();
  const [dayId, setDayId] = useState(() => suggestedDayId(new Date()));
  const [trackId, setTrackId] = useState<TrackId | "all">("all");
  const [lens, setLens] = useState<AgendaLens>("all");
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  const results = filterAgenda({
    sessions,
    speakers,
    rooms: forum.venue.rooms,
    dayId: searching ? "all" : dayId,
    trackId,
    lens,
    query,
    favoriteIds: state.favoriteIds,
    heldSeatIds: state.heldSeatIds,
  });

  return (
    <Screen>
      <PageHeader kicker="Program" title="Agenda" subtitle="Times in Pacific, and on this phone when they differ." />
      <SearchField value={query} onChange={setQuery} placeholder="Search sessions, speakers, rooms" />
      <View style={styles.days}>
        {forum.days.map((day) => {
          const selected = !searching && day.id === dayId;
          return (
            <Pressable
              key={day.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                setDayId(day.id);
                setQuery("");
              }}
              style={styles.day}
            >
              <T variant="eyebrow" color={selected ? colors.pine : colors.inkSoft}>
                {day.shortWeekday}
              </T>
              <T variant="headline" color={selected ? colors.ink : colors.inkSoft} style={styles.dayNumber}>
                {day.dayNumber}
              </T>
              <View style={[styles.dayRule, selected && styles.dayRuleOn]} />
            </Pressable>
          );
        })}
      </View>
      {searching ? (
        <T variant="meta" style={styles.note}>
          Searching all three days.
        </T>
      ) : null}
      <View style={styles.segment}>
        {lenses.map((item) => {
          const selected = lens === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setLens(item.id)}
              style={[styles.segmentItem, selected && styles.segmentOn]}
            >
              <T variant="small" color={selected ? colors.ivory : colors.ink} style={styles.segmentLabel}>
                {item.label}
              </T>
            </Pressable>
          );
        })}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tracks}>
        <Chip label="All tracks" selected={trackId === "all"} onPress={() => setTrackId("all")} />
        {forum.tracks.map((track) => (
          <Chip
            key={track.id}
            label={track.name}
            swatch={track.color}
            selected={trackId === track.id}
            onPress={() => setTrackId(track.id)}
          />
        ))}
      </ScrollView>
      <T variant="meta" style={styles.count}>
        {results.length === 1 ? "1 session" : `${results.length} sessions`}
      </T>
      {results.length === 0 ? (
        <EmptyState title="Nothing on this cut" body="Try another day, another track, or a speaker's name." />
      ) : (
        results.map((session, index) => {
          const day = forum.days.find((item) => item.id === session.dayId);
          const previous = results[index - 1];
          const showDay = searching && previous?.dayId !== session.dayId;
          return (
            <View key={session.id}>
              {showDay && day ? (
                <T variant="eyebrow" style={styles.dayBreak}>
                  {day.weekday}
                </T>
              ) : null}
              <SessionRow session={session} />
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { flexDirection: "row", paddingHorizontal: pad, gap: 8, marginTop: 6 },
  day: { flex: 1, alignItems: "center", paddingTop: 6, gap: 2 },
  dayNumber: { fontSize: 26, lineHeight: 30 },
  dayRule: { marginTop: 6, height: 2, width: "70%", backgroundColor: "transparent" },
  dayRuleOn: { backgroundColor: colors.brass },
  note: { paddingHorizontal: pad, marginTop: 8 },
  segment: {
    flexDirection: "row",
    marginHorizontal: pad,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    overflow: "hidden",
  },
  segmentItem: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center" },
  segmentOn: { backgroundColor: colors.pine },
  segmentLabel: { fontFamily: fonts.medium },
  tracks: { paddingHorizontal: pad, paddingVertical: 14, gap: 8 },
  count: { paddingHorizontal: pad, marginBottom: 4 },
  dayBreak: { paddingHorizontal: pad, marginTop: 16, marginBottom: 4 },
});
