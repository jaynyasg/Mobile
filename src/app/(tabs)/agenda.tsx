import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { panelistById } from "@/content";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { SessionKind } from "@/content/types";
import { Glass } from "@/components/Glass";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { SessionRow } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { Chip, EmptyState, PageHeader } from "@/components/ui";
import { filterAgenda } from "@/logic/agenda";
import { suggestedDayId } from "@/logic/phase";
import { useApp } from "@/store";
import { colors, pad, sceneForIsland } from "@/theme";

const kinds: { id: SessionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "circuit", label: "Circuit" },
  { id: "regular", label: "Regular" },
];

export default function AgendaScreen() {
  const params = useLocalSearchParams<{ day?: string; panelist?: string; pillar?: string }>();
  const { program } = useContent();
  const { forum, panelists, sessions } = program;
  const { state } = useApp();
  const [dayId, setDayId] = useState(params.day || suggestedDayId(new Date()));
  const [pillarId, setPillarId] = useState(params.pillar || "all");
  const [island, setIsland] = useState("all");
  const [kind, setKind] = useState<SessionKind>("all");
  const [panelistId, setPanelistId] = useState(params.panelist || "all");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      filterAgenda({
        sessions,
        panelists,
        dayId,
        pillarId,
        island,
        kind,
        panelistId,
        query,
        favoriteIds: state.favoriteIds,
        favoritesOnly: false,
      }),
    [dayId, pillarId, island, kind, panelistId, query, state.favoriteIds],
  );
  const selectedPerson = panelistId === "all" ? undefined : panelistById(panelistId);

  return (
    <Screen docked photo={sceneForIsland(island === "all" ? "St. Thomas" : island)}>
      <PageHeader kicker="AST" title="Program" subtitle={`${forum.draftNotice} ${displayCopy(forum.timingNote)}`} />
      <Glass padded={false} blur={false} style={styles.days}>
        {[...forum.days.map((day) => ({ id: day.id, label: `${day.shortWeekday} ${day.dayNumber}` })), { id: "all", label: "All" }].map((day) => (
          <Pressable key={day.id} accessibilityRole="button" accessibilityState={{ selected: dayId === day.id }} onPress={() => setDayId(day.id)} style={[styles.day, dayId === day.id && styles.dayOn]}>
            <T variant="meta" color={dayId === day.id ? colors.ivory : colors.ink} style={styles.dayLabel}>{day.label}</T>
          </Pressable>
        ))}
      </Glass>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {kinds.map((item) => (
          <Chip key={item.id} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All pillars" selected={pillarId === "all"} onPress={() => setPillarId("all")} />
        {forum.pillars.map((pillar) => (
          <Chip key={pillar.id} label={pillar.name} selected={pillarId === pillar.id} onPress={() => setPillarId(pillar.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All islands" selected={island === "all"} onPress={() => setIsland("all")} />
        {forum.pillars.map((pillar) => (
          <Chip key={pillar.island} label={pillar.island} selected={island === pillar.island} onPress={() => setIsland(pillar.island)} />
        ))}
      </ScrollView>
      <View style={styles.search}>
        <SearchField value={query} onChange={setQuery} placeholder="Search titles or panelists" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Any panelist" selected={panelistId === "all"} onPress={() => setPanelistId("all")} />
        {panelists.map((person) => (
          <Chip
            key={person.id}
            label={person.name.split(" ")[0]}
            selected={panelistId === person.id}
            onPress={() => setPanelistId(person.id)}
          />
        ))}
      </ScrollView>
      {selectedPerson ? (
        <T variant="meta" style={styles.note}>
          Showing sessions led by {selectedPerson.name}.
        </T>
      ) : null}
      <T variant="meta" style={styles.note}>
        {visible.length} sessions
      </T>
      {visible.length === 0 ? (
        <EmptyState title="Nothing in this cut" body="Clear a filter or search. The underlying draft still has 200 sessions." />
      ) : (
        visible.map((session) => <SessionRow key={session.id} session={session} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { marginHorizontal: pad, marginBottom: 10, flexDirection: "row", padding: 4 },
  day: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  dayOn: { backgroundColor: colors.turquoise },
  dayLabel: { fontSize: 12, lineHeight: 14, textAlign: "center" },
  chips: { paddingHorizontal: pad, gap: 8, paddingBottom: 8 },
  search: { paddingHorizontal: pad, paddingBottom: 8 },
  note: { paddingHorizontal: pad, paddingBottom: 8, color: colors.inkSoft },
});
