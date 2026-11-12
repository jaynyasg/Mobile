import { Link, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { panelistById } from "@/content";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { SessionKind } from "@/content/types";
import { Glass } from "@/components/Glass";
import { PhotoShade } from "@/components/PhotoShade";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { SessionRow } from "@/components/SessionRow";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
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
  const lead = visible.slice(0, 5);

  return (
    <View style={styles.frame}>
      <Screen docked photo={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).day} night={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).night} phase={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).phase}>
        <Glass tone="dark" style={styles.titleRow}>
          <T variant="title" foil>Program</T>
          <Pressable accessibilityRole="button" accessibilityLabel="About this draft" onPress={() => setNote((open) => !open)} style={styles.info}>
            <T variant="meta" color={colors.gold}>i</T>
          </Pressable>
        </Glass>
        {note ? <T variant="meta" color={colors.onDarkSoft} style={styles.note}>{displayCopy(forum.draftNotice)}</T> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {[...forum.days.map((day) => ({ id: day.id, label: `${day.shortWeekday} ${day.dayNumber}` })), { id: "all", label: "All" }].map((day) => (
            <Pressable key={day.id} accessibilityRole="button" accessibilityState={{ selected: dayId === day.id }} onPress={() => setDayId(day.id)} style={[styles.day, dayId === day.id && styles.dayOn]}>
              <T variant="meta" color={colors.foam}>{day.label}</T>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" onPress={() => setFiltersOpen(true)} style={styles.filter}>
            <T variant="meta">Filter{filterCount ? ` · ${filterCount}` : ""}</T>
          </Pressable>
          <View style={styles.search}><SearchField value={query} onChange={setQuery} placeholder="Search" /></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {lead.map((session) => (
            <View key={session.id} style={styles.feature}>
              <TappablePhoto source={sceneForIsland(session.island)} alt={`${displayCopy(session.title)} on ${session.island}`} style={styles.featurePhoto} />
              <PhotoShade />
              <Link href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={displayCopy(session.title)} style={styles.featureCopy}>
                  <T variant="small" color={colors.onDark} numberOfLines={2}>{displayCopy(session.title)}</T>
                  <T variant="meta" color={colors.gold}>{session.island}</T>
                </Pressable>
              </Link>
            </View>
          ))}
        </ScrollView>
        {selectedPerson ? <T variant="meta" style={styles.note}>{selectedPerson.name}</T> : null}
        <Glass padded={false} style={styles.count}>
          <T variant="meta">{visible.length} sessions</T>
        </Glass>
        {visible.length === 0 ? (
          <EmptyState title="Nothing in this cut" body="Clear a filter. The draft is still here." />
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
  days: { paddingHorizontal: 22, gap: 8, paddingTop: 16, paddingBottom: 8 },
  day: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.84)" },
  dayOn: { backgroundColor: "rgba(16,52,68,0.92)", borderColor: colors.gold },
  tools: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 22, paddingBottom: 8 },
  filter: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.84)" },
  search: { flex: 1 },
  carousel: { paddingHorizontal: 22, gap: 12, paddingVertical: 8 },
  feature: { width: 210, height: 132, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.45)" },
  featurePhoto: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  featureCopy: { padding: 12, gap: 2, zIndex: 1 },
  sheet: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end" },
  sheetBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.45)" },
  sheetCard: { margin: 12, marginBottom: 96, padding: 16, gap: 10, borderRadius: 16, backgroundColor: "rgba(10,20,35,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(247,244,239,0.3)" },
  chips: { gap: 8 },
  done: { backgroundColor: colors.gold, minHeight: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
