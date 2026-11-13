import { StyleSheet, View } from "react-native";
import { TOPIC_COLOR } from "@/logic/topic";
import { T } from "./Text";

export function TopicChip({ id, name }: { id: string; name: string }) {
  const color = TOPIC_COLOR[id] ?? "#FFE08A";
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <T variant="meta" color={color} style={styles.label} numberOfLines={1}>
        {name}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(7,27,42,0.35)",
  },
  label: { fontSize: 12, lineHeight: 16 },
});
