import { ScrollView, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import type { Day } from "@/content/types";
import { dayChipLabel } from "@/logic/dayTheme";
import { colors } from "@/theme";
import { T } from "./Text";

export function DayFilter({
  days,
  dayId,
  onChange,
}: {
  days: Day[];
  dayId: string;
  onChange: (id: string) => void;
}) {
  const chips = [{ id: "all", label: "All" }, ...days.map((day) => ({ id: day.id, label: dayChipLabel(day) }))];
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => {
          const on = dayId === chip.id;
          return (
            <Pressable
              key={chip.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(chip.id)}
              style={[styles.chip, on && styles.on]}
            >
              <T variant="meta" color={on ? colors.ink : colors.foam} style={[styles.label, nowrap]}>{chip.label}</T>
            </Pressable>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.fade} />
    </View>
  );
}

const nowrap = { whiteSpace: "nowrap" } as ViewStyle;

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  row: { paddingLeft: 16, paddingRight: 36, paddingVertical: 10, gap: 8, flexGrow: 0 },
  chip: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.48)",
    backgroundColor: "rgba(7,27,42,0.86)",
  },
  label: { flexShrink: 0 },
  on: { backgroundColor: colors.gold, borderColor: colors.gold },
  fade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 28,
    ...({ backgroundImage: "linear-gradient(to right, rgba(7,20,33,0), rgba(7,20,33,0.95))" } as ViewStyle),
  },
});
