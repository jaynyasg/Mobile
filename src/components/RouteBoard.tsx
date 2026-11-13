import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import type { Day } from "@/content/types";
import { displayCopy } from "@/content/display";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import { describeStop, routePins, type PlanDay } from "@/logic/customRoute";
import { sessionClock } from "@/logic/dayTheme";
import { colors } from "@/theme";

export function RouteBoard({
  plan,
  days,
  modeName,
  timeZone,
  onEdit,
  bottom,
}: {
  plan: PlanDay[];
  days: Day[];
  modeName: string;
  timeZone: string;
  onEdit: () => void;
  bottom: number;
}) {
  const pins = routePins(plan);
  const line = pins.map((pin) => `${pin.x * 100},${pin.y * 100}`).join(" ");
  let number = 0;
  return (
    <ScrollView style={styles.fill} contentContainerStyle={[styles.scroll, { paddingBottom: bottom }]} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" accessibilityLabel="Edit picks" onPress={onEdit} style={styles.edit}>
        <T variant="meta" color={colors.gold}>Edit picks</T>
      </Pressable>
      <View style={styles.map} accessibilityLabel={`${modeName} route map`}>
        {pins.length > 1 ? (
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.lines}>
            <Polyline points={line} fill="none" stroke={colors.gold} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
          </Svg>
        ) : null}
        {pins.map((pin) => (
          <View key={`${pin.dayId}-${pin.n}`} style={[styles.pin, { left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }]}>
            <T variant="meta" color={colors.ink}>{pin.n}</T>
          </View>
        ))}
        <View style={styles.boat}>
          <T variant="meta" color={colors.ink}>{modeName}</T>
        </View>
      </View>
      <T variant="small" color={colors.foam}>{pins.map((pin) => `${pin.n} ${pin.island}`).join("  ·  ")}</T>
      {plan.map((day) => {
        const meta = days.find((item) => item.id === day.dayId);
        return (
          <View key={day.dayId} style={styles.day}>
            <T variant="small" color={colors.gold}>{meta?.label ?? day.dayId}</T>
            {day.stops.map((stop) => {
              number += 1;
              const when = sessionClock({ start: stop.session.start, end: stop.session.end, timeLabel: null }, timeZone);
              const lines = describeStop(stop, when, displayCopy(stop.session.title));
              const warn = stop.clash || stop.leg?.tight;
              return (
                <View key={stop.session.id} style={[styles.card, warn && styles.cardWarn]}>
                  <View style={styles.num}>
                    <T variant="meta" color={colors.ink}>{number}</T>
                  </View>
                  <View style={styles.copy}>
                    {lines.map((line) => (
                      <T key={line} variant="small" color={line.endsWith("overlap.") || line.endsWith("connection.") ? colors.gold : colors.foam}>{line}</T>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 12, gap: 12 },
  edit: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  map: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#071421",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.48)",
  },
  lines: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  pin: {
    position: "absolute",
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  boat: {
    position: "absolute",
    left: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  day: { gap: 8 },
  card: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 16, ...nightGlass },
  cardWarn: { borderColor: colors.gold, borderWidth: 1 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  copy: { flex: 1, gap: 4 },
});
