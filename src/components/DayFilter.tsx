import { Pressable, StyleSheet, ViewStyle } from "react-native";
import type { Day } from "@/content/types";
import { dayChipLabel } from "@/logic/dayTheme";
import { colors } from "@/theme";
import { ChipRail } from "./ChipRail";
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
    <ChipRail pad={16}>
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
    </ChipRail>
  );
}

const nowrap = { whiteSpace: "nowrap" } as ViewStyle;

const styles = StyleSheet.create({
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
});
