import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import type { Day, Session, TransportMode } from "@/content/types";
import { displayCopy } from "@/content/display";
import { DayFilter } from "@/components/DayFilter";
import { Icon } from "@/components/Icon";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import {
  buildRoute,
  readRoutePlan,
  writeRoutePlan,
  type PlanSession,
} from "@/logic/customRoute";
import { sessionClock } from "@/logic/dayTheme";
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
  timeZone,
}: {
  sessions: Session[];
  days: Day[];
  modes: TransportMode[];
  timeZone: string;
}) {
  const router = useRouter();
  const { state, hydrated } = useApp();
  const [ids, setIds] = useState<string[] | null>(null);
  const [dayId, setDayId] = useState(days[0]?.id ?? "all");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!hydrated || ids !== null) return;
    const store = typeof localStorage === "undefined" ? null : localStorage;
    const saved = readRoutePlan(store);
    const next = saved ?? state.favoriteIds;
    setIds(next);
    if (!saved) writeRoutePlan(store, next);
  }, [hydrated, ids, state.favoriteIds]);

  const picked = useMemo(() => {
    const chosen = new Set(ids ?? []);
    return sessions.filter((session) => chosen.has(session.id)).map(asPlan);
  }, [ids, sessions]);
  const plan = useMemo(() => buildRoute(picked, modes), [picked, modes]);
  const visible = sessions
    .filter((session) => dayId === "all" || session.dayId === dayId)
    .slice()
    .sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999") || a.title.localeCompare(b.title));
  const showPicker = editing || (ids !== null && ids.length === 0);

  function toggle(id: string) {
    setIds((current) => {
      const base = current ?? [];
      const next = base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
      writeRoutePlan(typeof localStorage === "undefined" ? null : localStorage, next);
      setEditing(true);
      return next;
    });
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
          <DayFilter days={days} dayId={dayId} onChange={setDayId} />
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
      {plan.map((day) => {
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
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 12, paddingBottom: 28, gap: 12 },
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
