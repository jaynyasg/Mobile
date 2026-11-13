import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Day, Pillar, Session, TransportMode } from "@/content/types";
import { displayCopy } from "@/content/display";
import { Icon } from "@/components/Icon";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import { dockClearance } from "@/components/Dock";
import {
  buildRoute,
  canCreateRoute,
  readCreatedRoute,
  readRouteMode,
  readRoutePlan,
  routePicker,
  writeCreatedRoute,
  writeRouteMode,
  writeRoutePlan,
  type PlanSession,
} from "@/logic/customRoute";
import { RouteBoard } from "@/components/RouteBoard";
import { sessionClock } from "@/logic/dayTheme";
import { modeLabel } from "@/logic/transportPlan";
import { readTracks, webTrackStore } from "@/guide/interests";
import { islandsForTracks, sameIslands } from "@/logic/trackFilter";
import { useApp } from "@/store";
import { colors, sceneForIsland } from "@/theme";

function asPlan(session: Session): PlanSession {
  const venue = session.venue.specific?.trim();
  return {
    id: session.id,
    title: session.title,
    dayId: session.dayId,
    start: session.start,
    end: session.end,
    island: session.island,
    venue: venue || null,
  };
}

export function CustomRoute({
  sessions,
  days,
  modes,
  pillars,
  timeZone,
}: {
  sessions: Session[];
  days: Day[];
  modes: TransportMode[];
  pillars: Pillar[];
  timeZone: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, hydrated } = useApp();
  const [ids, setIds] = useState<string[] | null>(null);
  const [modeId, setModeId] = useState(modes[0]?.id ?? "powerboat");
  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const presetIslands = islandsForTracks(readTracks(webTrackStore()), pillars);
  const [island, setIsland] = useState<string[] | "all">(presetIslands.length ? [...presetIslands] : "all");
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"edit" | "result">("edit");
  const islands = pillars.map((pillar) => pillar.island);

  useEffect(() => {
    if (!hydrated || ids !== null) return;
    const store = typeof localStorage === "undefined" ? null : localStorage;
    const created = readCreatedRoute(store);
    const saved = readRoutePlan(store);
    const savedMode = readRouteMode(store);
    if (created && modes.some((mode) => mode.id === created.modeId)) {
      setModeId(created.modeId);
      setIds(created.ids);
      setView("result");
      return;
    }
    if (savedMode && modes.some((mode) => mode.id === savedMode)) setModeId(savedMode);
    const next = saved ?? state.favoriteIds;
    setIds(next);
    if (!saved) writeRoutePlan(store, next);
  }, [hydrated, ids, modes, state.favoriteIds]);

  const picked = useMemo(() => {
    const chosen = new Set(ids ?? []);
    return sessions.filter((session) => chosen.has(session.id)).map(asPlan);
  }, [ids, sessions]);
  const plan = useMemo(() => buildRoute(picked, modes, undefined, modeId), [picked, modes, modeId]);
  const dayPlan = plan.find((day) => day.dayId === dayId);
  const visible = routePicker(sessions, dayId, island)
    .slice()
    .sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999") || a.title.localeCompare(b.title));
  const showPicker = editing || island !== "all" || !dayPlan?.stops.length;

  function createRoute() {
    if (!canCreateRoute(ids)) return;
    const store = typeof localStorage === "undefined" ? null : localStorage;
    writeCreatedRoute(store, { ids: ids ?? [], modeId });
    writeRouteMode(store, modeId);
    setView("result");
  }

  function chooseMode(id: string) {
    setModeId(id);
    writeRouteMode(typeof localStorage === "undefined" ? null : localStorage, id);
  }

  function toggle(id: string) {
    setIds((current) => {
      const base = current ?? [];
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
      writeRoutePlan(typeof localStorage === "undefined" ? null : localStorage, next);
      setEditing(true);
      return next;
    });
  }

  const areasOn = island !== "all" && presetIslands.length > 0 && sameIslands(island, presetIslands);

  function toggleIsland(name: string) {
    setIsland((current) => {
      if (current === "all") return [name];
      return current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
    });
  }

  const ready = canCreateRoute(ids);
  const boat = modeLabel(modes.find((mode) => mode.id === modeId) ?? modes[0]);
  if (view === "result") {
    return (
      <RouteBoard
        plan={plan}
        days={days}
        modeName={boat}
        timeZone={timeZone}
        onEdit={() => setView("edit")}
        bottom={dockClearance(insets.bottom)}
      />
    );
  }

  return (
    <View style={styles.fill}>
      <View style={styles.controls}>
        <View style={styles.segment}>
          {modes.map((mode) => {
            const on = mode.id === modeId;
            const label = modeLabel(mode);
            return (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={label}
                onPress={() => chooseMode(mode.id)}
                style={[styles.segmentItem, on && styles.segmentOn]}
              >
                <T variant="meta" color={on ? colors.ink : colors.foam} numberOfLines={2} style={styles.segmentLabel}>{label}</T>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.segment}>
          {days.map((day) => {
            const on = day.id === dayId;
            return (
              <Pressable
                key={day.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={day.label}
                onPress={() => setDayId(day.id)}
                style={[styles.segmentItem, on && styles.segmentOn]}
              >
                <T variant="meta" color={on ? colors.ink : colors.foam} style={styles.segmentLabel}>{day.label}</T>
              </Pressable>
            );
          })}
        </View>
        <View accessibilityLabel="Infrastructure" style={styles.infra}>
          <T variant="meta" color={colors.gold}>Infrastructure</T>
          {areasOn ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Your areas filter is on. Clear it." onPress={() => setIsland("all")} style={styles.areasChip}>
              <T variant="meta" color={colors.ink}>Your areas</T>
              <T variant="meta" color={colors.ink}>Clear</T>
            </Pressable>
          ) : null}
          <View style={styles.infraScroll}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.infraRow}>
              <IslandChip label="All islands" selected={island === "all"} onPress={() => setIsland("all")} />
              {islands.map((name) => (
                <IslandChip key={name} label={name} selected={island !== "all" && island.includes(name)} onPress={() => toggleIsland(name)} />
              ))}
            </ScrollView>
            <View pointerEvents="none" style={styles.infraFade} />
          </View>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create my route"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={createRoute}
        style={[styles.create, !ready && styles.createOff]}
      >
        <T variant="button" color={colors.ink}>Create my route</T>
      </Pressable>
    <ScrollView style={styles.fill} contentContainerStyle={[styles.scroll, { paddingBottom: dockClearance(insets.bottom) }]} keyboardShouldPersistTaps="handled">
      {ids !== null && ids.length === 0 ? (
        <View style={styles.empty}>
          <T variant="rowTitle" color={colors.foam}>No sessions yet</T>
          <T variant="small" color={colors.foam}>Star the ones you want, or pick them here.</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Sessions" onPress={() => router.push("/agenda")} style={styles.open}>
            <T variant="button" color={colors.ink}>Open Sessions</T>
          </Pressable>
        </View>
      ) : null}
      {ids !== null && ids.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={showPicker ? "Hide sessions" : "Change sessions"} onPress={() => setEditing((open) => !open)} style={styles.change}>
          <T variant="meta" color={colors.gold}>{showPicker ? "Hide sessions" : "Change sessions"}</T>
        </Pressable>
      ) : null}
      {showPicker ? (
        <View style={styles.picker}>
          {visible.length === 0 ? <T variant="small" color={colors.foam}>No sessions for this day.</T> : null}
          {visible.map((session) => {
            const on = ids?.includes(session.id) ?? false;
            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={session.title}
                onPress={() => toggle(session.id)}
                style={[styles.pick, on && styles.pickOn]}
              >
                <Image source={{ uri: sceneForIsland(session.island) }} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
                <View style={styles.pickCopy}>
                  <T variant="small" color={colors.foam} numberOfLines={2}>{displayCopy(session.title)}</T>
                  <T variant="meta" color={colors.gold} numberOfLines={1}>{session.island} · {sessionClock(session, timeZone)}</T>
                </View>
                {on ? (
                  <View style={styles.check}>
                    <T variant="button" color={colors.ink}>✓</T>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {dayPlan ? [dayPlan].map((day) => {
        const meta = days.find((item) => item.id === day.dayId);
        return (
          <View key={day.dayId} style={styles.day}>
            <T variant="small" color={colors.gold}>{meta?.label ?? day.dayId}</T>
            {day.stops.map((stop) => (
              <View key={stop.session.id} style={styles.stopBlock}>
                {stop.leg ? (
                  <View style={[styles.leg, stop.leg.tight && styles.legTight]}>
                    <Icon name="boat" size={18} color={colors.gold} />
                    <View style={styles.legCopy}>
                      <T variant="small" color={colors.foam} numberOfLines={2}>
                        {stop.leg.from} → {stop.leg.to}
                      </T>
                      <T variant="meta" color={colors.gold} numberOfLines={2}>
                        {stop.leg.mode} · {stop.leg.duration}{stop.leg.estimated ? " · Estimate" : ""}
                      </T>
                      {stop.leg.depart ? <T variant="meta" color={colors.foam}>Leave by {stop.leg.depart}</T> : null}
                      {stop.leg.tight ? <T variant="meta" color={colors.gold}>Tight connection</T> : null}
                    </View>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={stop.session.title}
                  onPress={() => router.push({ pathname: "/session/[id]", params: { id: stop.session.id } })}
                  style={[styles.card, stop.clash && styles.cardClash]}
                >
                  <Image source={{ uri: sceneForIsland(stop.session.island) }} style={styles.cardPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                  <View style={styles.cardCopy}>
                    <T variant="meta" color={colors.gold} numberOfLines={1}>{sessionClock({ start: stop.session.start, end: stop.session.end, timeLabel: null }, timeZone)} · {stop.session.island}</T>
                    <T variant="rowTitle" color={colors.foam} numberOfLines={2}>{displayCopy(stop.session.title)}</T>
                    {stop.clash ? <T variant="meta" color={colors.gold}>These overlap</T> : null}
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        );
      }) : null}
    </ScrollView>
    </View>
  );
}

function IslandChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <T variant="meta" color={selected ? colors.ink : colors.foam} style={styles.chipLabel}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  controls: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, ...nightGlass },
  segmentItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, paddingVertical: 6, borderRadius: 12 },
  segmentOn: { backgroundColor: colors.gold },
  segmentLabel: { textAlign: "center" },
  infra: { gap: 6 },
  areasChip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.gold },
  infraScroll: {
    position: "relative",
    ...({
      maskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 40px), transparent 100%)",
      WebkitMaskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 40px), transparent 100%)",
    } as ViewStyle),
  },
  infraRow: { gap: 8, paddingRight: 48, flexGrow: 0 },
  infraFade: {
    position: "absolute",
    top: 0,
    right: -12,
    bottom: 0,
    width: 88,
    zIndex: 2,
    ...({ backgroundImage: "linear-gradient(to right, rgba(7,20,33,0) 0%, rgba(6,14,24,0.82) 28%, rgba(6,14,24,0.96) 62%)" } as ViewStyle),
  },
  create: { marginHorizontal: 12, marginBottom: 8, minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  createOff: { opacity: 0.4 },
  chip: { flexGrow: 0, flexShrink: 0, alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.86)" },
  chipLabel: { flexShrink: 0, ...({ whiteSpace: "nowrap" } as ViewStyle) },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  scroll: { paddingHorizontal: 12, gap: 12 },
  empty: { padding: 16, gap: 8, borderRadius: 18, ...nightGlass },
  open: { alignSelf: "flex-start", minHeight: 48, marginTop: 4, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  change: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  picker: { gap: 8 },
  pick: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 72, padding: 8, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.28)", ...nightGlass },
  pickOn: { borderColor: colors.gold, borderWidth: 2 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  pickCopy: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 2 },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  day: { gap: 8 },
  stopBlock: { gap: 8 },
  leg: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 16, ...nightGlass },
  legTight: { borderColor: colors.gold, borderWidth: 1 },
  legCopy: { flex: 1, gap: 2 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 16, ...nightGlass },
  cardClash: { borderColor: colors.gold, borderWidth: 1 },
  cardPhoto: { width: 72, height: 72, borderRadius: 12 },
  cardCopy: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 2 },
});
