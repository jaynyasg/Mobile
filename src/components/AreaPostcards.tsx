import { Image, Pressable, StyleSheet, View } from "react-native";
import type { Pillar } from "@/content/types";
import { reels, type ReelId } from "@/content/reels";
import { colors } from "@/theme";
import { T } from "./Text";

export function AreaPostcards({ pillars, selected, onToggle, buttons = false }: { pillars: Pillar[]; selected: readonly string[]; onToggle: (id: string) => void; buttons?: boolean }) {
  return <View style={styles.grid}>{pillars.map(pillar => {
    const checked = selected.includes(pillar.id);
    return <Pressable key={pillar.id} accessibilityRole={buttons ? "button" : "checkbox"} accessibilityLabel={`${buttons && checked ? "✓ " : ""}${pillar.name}`} aria-pressed={buttons ? checked : undefined} aria-checked={buttons ? undefined : checked} onPress={() => onToggle(pillar.id)} style={[styles.card, checked && styles.selected]}>
      <Image source={{ uri: reels[pillar.id as ReelId]?.poster }} style={styles.photo} resizeMode="cover" />
      <View style={styles.copy}><T variant="rowTitle" color={checked ? colors.gold : colors.foam}>{checked ? "✓ " : ""}{pillar.name}</T><T variant="meta">{pillar.island}</T></View>
    </Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, card: { flexGrow: 1, flexBasis: "46%", minWidth: 110, borderWidth: 1, borderColor: colors.inkSoft, borderRadius: 12, overflow: "hidden", backgroundColor: colors.stage }, selected: { borderColor: colors.gold }, photo: { height: 84, width: "100%" }, copy: { padding: 12, gap: 4 },
});
