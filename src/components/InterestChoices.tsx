import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Pillar, Session } from "@/content/types";
import { availableNeeds } from "@/logic/islandNeeds";
import { availableSubtopics } from "@/logic/sessionGuide";
import { colors } from "@/theme";
import { T } from "./Text";

export function InterestChoices({ sessions, pillars, areas, selected, onToggle, buttons = false }: {
  sessions: Session[]; pillars: Pillar[]; areas: string[]; selected: string[]; onToggle: (id: string) => void; buttons?: boolean;
}) {
  const [specific, setSpecific] = useState(selected.some(id => !id.startsWith("need:")));
  function option(id: string, title: string, line: string, count: number, areaIds: string[]) {
    const checked = selected.includes(id);
    return <Pressable key={id} accessibilityRole={buttons ? "button" : "checkbox"} accessibilityLabel={`${buttons && checked ? "✓ " : ""}${title}`} aria-pressed={buttons ? checked : undefined} aria-checked={buttons ? undefined : checked} onPress={() => onToggle(id)} style={[styles.option, checked && styles.selected]}>
      <T variant="rowTitle" color={colors.foam}>{checked ? "✓ " : ""}{title}</T>
      <T variant="small">{line} · {count} session{count === 1 ? "" : "s"}</T>
      <T variant="meta" color={colors.gold}>In {pillars.filter(pillar => areaIds.includes(pillar.id)).map(pillar => pillar.name).join(" · ")}</T>
    </Pressable>;
  }
  return <View style={styles.group}>
    <T variant="small">Choose the island needs you care about. You can select more than one. Each option brings together sessions from all your selected infrastructure areas.</T>
    <T variant="rowTitle" color={colors.gold}>Fields from {areas.length ? pillars.filter(pillar => areas.includes(pillar.id)).map(pillar => pillar.name).join(" · ") : "all infrastructure areas"}</T>
    <View testID="island-need-options" style={styles.group}>
      {availableNeeds(sessions, areas).map(need => option(need.id, need.title, need.line, need.count, need.areaIds))}
    </View>
    <Pressable accessibilityRole="button" aria-expanded={specific} onPress={() => setSpecific(!specific)} style={styles.toggle}><T variant="button" color={colors.gold}>{specific ? "Hide specific fields" : "Show specific fields"}</T></Pressable>
    {specific ? <>
      <T variant="small">Looking for AgriTech, FilmTech, or another specific field? Add it here. Your results include any need or field you select; shared fields appear once.</T>
      <View testID="sub-infrastructure-options" style={styles.group}>{availableSubtopics(sessions, areas).map(topic => option(topic.id, topic.id, topic.line, topic.count, topic.areaIds))}</View>
    </> : null}
    <T variant="meta">Leave these blank to explore every field in your selected areas.</T>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: 14 }, option: { padding: 16, gap: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,224,138,0.35)", backgroundColor: "rgba(7,27,42,0.86)" },
  selected: { borderColor: colors.gold, backgroundColor: "rgba(67,58,32,0.9)" }, toggle: { minHeight: 48, justifyContent: "center" },
});
