import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { panelistById } from "@/content";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { SessionKind } from "@/content/types";
import { Glass } from "@/components/Glass";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { SessionRow } from "@/components/SessionRow";
import { SessionGuide } from "@/components/SessionGuide";
import { T } from "@/components/Text";
import { DayFilter } from "@/components/DayFilter";
import { ChipRail } from "@/components/ChipRail";
import { Chip, EmptyState } from "@/components/ui";
import { readTracks, webTrackStore } from "@/guide/interests";
import { filterAgenda } from "@/logic/agenda";
import { activeTrackIds } from "@/logic/trackFilter";
import { suggestedDayId } from "@/logic/phase";
import { useApp } from "@/store";
import { backgrounds } from "@/components/backgrounds";
import { dockClearance } from "@/components/Dock";
import { nightGlass } from "@/components/nightGlass";
import { colors, sceneForIsland } from "@/theme";
import { StepBridge } from "@/components/StepBridge";
import { useIntake } from "@/logic/useIntake";

const kinds: { id: SessionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "circuit", label: "Circuit" },
  { id: "regular", label: "Regular" },
];

export default function AgendaScreen() {
  const router = useRouter();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const programOffset = useRef(0);
  const params = useLocalSearchParams<{ day?: string; panelist?: string; pillar?: string }>();
  const { program } = useContent();
  const { forum, panelists, sessions } = program;
  const { state } = useApp();
  const intake = useIntake();
  const preferenceKey = JSON.stringify([intake?.areas, intake?.interests, intake?.sessionGoals]);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [preferenceKey]);
  const trackIds = activeTrackIds(intake?.areas ?? readTracks(webTrackStore()), forum.pillars);
  const [yourAreas, setYourAreas] = useState(trackIds.length > 0 && !params.pillar);
  const [dayId, setDayId] = useState(params.day || suggestedDayId(new Date()));
  const [pillarId, setPillarId] = useState(params.pillar || "all");
  const [island, setIsland] = useState("all");
  const [kind, setKind] = useState<SessionKind>("all");
  const [panelistId, setPanelistId] = useState(params.panelist || "all");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [note, setNote] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!params.day || !forum.days.some(day => day.id === params.day)) return;
    setDayId(params.day); setYourAreas(false); setPillarId("all"); setIsland("all"); setKind("all"); setPanelistId("all"); setQuery("");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [params.day, forum.days]);

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
        trackIds: yourAreas ? trackIds : [],
        pillars: forum.pillars,
      }),
    [dayId, pillarId, island, kind, panelistId, query, state.favoriteIds, yourAreas, trackIds, sessions, panelists, forum.pillars],
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
      <Screen scrollRef={scrollRef} docked photo={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).day} night={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).night} phase={(island === "all" ? backgrounds.program : backgrounds.session[island] ?? backgrounds.program).phase}>
        {!params.day ? <SessionGuide onStepChange={() => scrollRef.current?.scrollTo({ y: 0, animated: false })} onMatches={() => setYourAreas(false)} onBrowse={() => { setYourAreas(false); setDayId("all"); setPillarId("all"); setIsland("all"); setKind("all"); setPanelistId("all"); setQuery(""); scrollRef.current?.scrollTo({ y: programOffset.current, animated: true }); }} /> : <Pressable accessibilityRole="button" onPress={() => router.setParams({ day: undefined })} style={styles.noteCard}><T variant="button" color={colors.gold}>See sessions matched to my interests</T></Pressable>}
        <Pressable accessibilityRole="button" onPress={() => router.push("/schedule")} style={styles.noteCard}><T variant="button" color={colors.gold}>My schedule · {state.favoriteIds.length} saved</T></Pressable>
        <View onLayout={(event) => { programOffset.current = event.nativeEvent.layout.y; }}>
        <Glass tone="dark" style={styles.titleRow}>
          <T variant="title" foil>Full program</T>
          <Pressable accessibilityRole="button" accessibilityLabel="About this draft" onPress={() => setNote((open) => !open)} style={styles.info}>
            <T variant="meta" color={colors.gold}>i</T>
          </Pressable>
        </Glass>
        </View>
        {note ? <View style={styles.noteCard}><T variant="meta" color={colors.onDarkSoft}>{displayCopy(forum.draftNotice)}</T></View> : null}
        <View style={styles.dayBar}>
          <DayFilter days={forum.days} dayId={dayId} onChange={setDayId} />
        </View>
        <ChipRail pad={16}>
          <Chip label="All topics" selected={pillarId === "all"} onPress={() => { setYourAreas(false); setPillarId("all"); }} />
          {forum.pillars.map((pillar) => (
            <Chip key={pillar.id} label={pillar.name} selected={!yourAreas && pillarId === pillar.id} onPress={() => { setYourAreas(false); setPillarId(pillar.id); }} />
          ))}
        </ChipRail>
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
                onPress={() => {
                  setYourAreas(false);
                  setIsland(selected ? "all" : pillar.island);
                }}
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
        {yourAreas ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Your areas filter is on. Clear it." onPress={() => setYourAreas(false)} style={styles.activeChip}>
            <T variant="meta" color={colors.foam}>Your areas</T>
            <T variant="meta" color={colors.gold}>Clear</T>
          </Pressable>
        ) : island !== "all" ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${island} filter`} onPress={() => setIsland("all")} style={styles.activeChip}>
            <T variant="meta" color={colors.foam}>{island}</T>
            <T variant="meta" color={colors.gold}>Clear</T>
          </Pressable>
        ) : null}
        {selectedPerson ? <View style={styles.noteCard}><T variant="meta">{selectedPerson.name}</T></View> : null}
        <Glass padded={false} style={styles.count}>
          <T variant="meta">{visible.length} sessions</T>
        </Glass>
        {visible.length === 0 ? (
          <EmptyState title="Nothing on this day" body={emptyBody} />
        ) : (
          visible.map((session) => <SessionRow key={session.id} session={session} />)
        )}
        <StepBridge id="sessions" footer />
      </Screen>
      {filtersOpen ? (
        <View style={styles.sheet}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close filters" style={styles.sheetBackdrop} onPress={() => setFiltersOpen(false)} />
          <View style={[styles.sheetCard, { marginBottom: dockClearance(insets.bottom) }]}>
            <T variant="eyebrow" color={colors.gold}>Filter</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {kinds.map((item) => (
                <Chip key={item.id} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="All topics" selected={pillarId === "all"} onPress={() => { setYourAreas(false); setPillarId("all"); }} />
              {forum.pillars.map((pillar) => (
                <Chip key={pillar.id} label={pillar.name} selected={!yourAreas && pillarId === pillar.id} onPress={() => { setYourAreas(false); setPillarId(pillar.id); }} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="All islands" selected={!yourAreas && island === "all"} onPress={() => { setYourAreas(false); setIsland("all"); }} />
              {forum.pillars.map((pillar) => (
                <Chip key={pillar.island} label={pillar.island} selected={!yourAreas && island === pillar.island} onPress={() => { setYourAreas(false); setIsland(pillar.island); }} />
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
  noteCard: { alignSelf: "stretch", marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, ...nightGlass },
  count: { alignSelf: "flex-start", marginLeft: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  dayBar: { backgroundColor: "rgba(7,20,33,0.92)" },
  tools: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 22, paddingBottom: 8 },
  filter: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.58)" },
  search: { flex: 1 },
  carousel: { paddingLeft: 16, paddingRight: 28, gap: 12, paddingVertical: 8 },
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
