import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { panelistById } from "@/content";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { SessionKind } from "@/content/types";
import { Glass } from "@/components/Glass";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { SessionRow } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { DayFilter } from "@/components/DayFilter";
import { Chip, EmptyState } from "@/components/ui";
import { filterAgenda } from "@/logic/agenda";
import { suggestedDayId } from "@/logic/phase";
import { useApp } from "@/store";
import { backgrounds } from "@/components/backgrounds";
import { colors, sceneForIsland } from "@/theme";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [note, setNote] = useState(false);

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
  const filterCount = [pillarId, island, kind, panelistId].filter((value) => value !== "all").length;
  const topicName = pillarId === "all" ? "" : forum.pillars.find((pillar) => pillar.id === pillarId)?.name ?? "";
  const emptyBody = topicName && island !== "all"
    ? `No ${topicName} sessions on ${island} for this day. Clear a filter, or pick another day.`
    : topicName
      ? `No ${topicName} sessions for this day. Clear the topic, or pick another day.`
      : island !== "all"
        ? `No sessions on ${island} for this day. Clear the island, or pick another day.`
        : "Nothing matches. Clear a filter.";

  return (
    <View style={styles.frame}>
      <Screen docked photo={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).day} night={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).night} phase={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).phase}>
        <Glass tone="dark" style={styles.titleRow}>
          <T variant="title" foil>Sessions</T>
          <Pressable accessibilityRole="button" accessibilityLabel="About this draft" onPress={() => setNote((open) => !open)} style={styles.info}>
            <T variant="meta" color={colors.gold}>i</T>
          </Pressable>
        </Glass>
        {note ? <T variant="meta" color={colors.onDarkSoft} style={styles.note}>{displayCopy(forum.draftNotice)}</T> : null}
        <View style={styles.dayBar}>
          <DayFilter days={forum.days} dayId={dayId} onChange={setDayId} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topics}>
          <Chip label="All topics" selected={pillarId === "all"} onPress={() => setPillarId("all")} />
          {forum.pillars.map((pillar) => (
            <Chip key={pillar.id} label={pillar.name} selected={pillarId === pillar.id} onPress={() => setPillarId(pillar.id)} />
          ))}
        </ScrollView>
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" onPress={() => setFiltersOpen(true)} style={styles.filter}>
            <T variant="meta">Filter{filterCount ? ` · ${filterCount}` : ""}</T>
          </Pressable>
          <View style={styles.search}><SearchField value={query} onChange={setQuery} placeholder="Search" /></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {forum.pillars.map((pillar) => {
            const selected = island === pillar.island;
            return (
              <Pressable
                key={pillar.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={selected ? `Clear ${pillar.island}` : `Show sessions on ${pillar.island}, ${pillar.name}`}
                onPress={() => setIsland(selected ? "all" : pillar.island)}
                style={[styles.islandCard, selected && styles.islandOn]}
              >
                <View style={styles.islandPhotoWrap}>
                  <Image source={{ uri: sceneForIsland(pillar.island) }} style={styles.islandPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                </View>
                <View style={styles.islandCopy}>
                  <T variant="rowTitle" numberOfLines={2}>{pillar.island} · {pillar.name}</T>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {island !== "all" ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${island} filter`} onPress={() => setIsland("all")} style={styles.activeChip}>
            <T variant="meta" color={colors.foam}>{island}</T>
            <T variant="meta" color={colors.gold}>Clear</T>
          </Pressable>
        ) : null}
        {selectedPerson ? <T variant="meta" style={styles.note}>{selectedPerson.name}</T> : null}
        <Glass padded={false} style={styles.count}>
          <T variant="meta">{visible.length} sessions</T>
        </Glass>
        {visible.length === 0 ? (
          <EmptyState title="Nothing on this day" body={emptyBody} />
        ) : (
          visible.map((session) => <SessionRow key={session.id} session={session} />)
        )}
      </Screen>
      {filtersOpen ? (
        <View style={styles.sheet}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close filters" style={styles.sheetBackdrop} onPress={() => setFiltersOpen(false)} />
          <View style={styles.sheetCard}>
            <T variant="eyebrow" color={colors.gold}>Filter</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {kinds.map((item) => (
                <Chip key={item.id} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="All topics" selected={pillarId === "all"} onPress={() => setPillarId("all")} />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Any panelist" selected={panelistId === "all"} onPress={() => setPanelistId("all")} />
              {panelists.map((person) => (
                <Chip key={person.id} label={person.name.split(" ")[0]} selected={panelistId === person.id} onPress={() => setPanelistId(person.id)} />
              ))}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setFiltersOpen(false)} style={styles.done}>
              <T variant="button" color={colors.ink}>Done</T>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  titleRow: { marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 14 },
  info: { width: 28, height: 28, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  note: { paddingHorizontal: 22, paddingTop: 8 },
  count: { alignSelf: "flex-start", marginLeft: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  dayBar: { backgroundColor: "rgba(7,20,33,0.92)" },
  tools: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 22, paddingBottom: 8 },
  filter: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.58)" },
  search: { flex: 1 },
  topics: { paddingHorizontal: 22, gap: 8, paddingBottom: 8 },
  carousel: { paddingHorizontal: 16, gap: 12, paddingVertical: 8 },
  islandCard: { width: 220, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.58)" },
  islandOn: { borderColor: colors.gold, borderWidth: 2 },
  islandPhotoWrap: { height: 124, overflow: "hidden" },
  islandPhoto: { width: 220, height: 124 },
  islandCopy: { padding: 12, gap: 6, minHeight: 76, justifyContent: "center" },
  activeChip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.gold, backgroundColor: "rgba(7,27,42,0.58)" },
  sheet: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end" },
  sheetBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.45)" },
  sheetCard: { margin: 12, marginBottom: 96, padding: 16, gap: 10, borderRadius: 16, backgroundColor: "rgba(7,27,42,0.62)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(247,244,239,0.3)" },
  chips: { gap: 8 },
  done: { backgroundColor: colors.gold, minHeight: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
