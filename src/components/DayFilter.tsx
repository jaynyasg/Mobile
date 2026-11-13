import { ScrollView, Pressable, StyleSheet } from "react-native";
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
            <T variant="meta" color={on ? colors.ink : colors.foam}>{chip.label}</T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.48)",
    backgroundColor: "rgba(7,27,42,0.86)",
  },
  on: { backgroundColor: colors.gold, borderColor: colors.gold },
});
