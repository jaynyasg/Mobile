import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Pillar, Session } from "@/content/types";
import { availableNeeds } from "@/logic/islandNeeds";
import { availableSubtopics } from "@/logic/sessionGuide";
import { colors } from "@/theme";
import { T } from "./Text";
import { Disclosure } from "./Disclosure";

export function InterestChoices({ sessions, pillars, areas, selected, onToggle, buttons = false }: {
  sessions: Session[]; pillars: Pillar[]; areas: string[]; selected: string[]; onToggle: (id: string) => void; buttons?: boolean;
}) {
  const [specific, setSpecific] = useState(selected.some(id => !id.startsWith("need:")));
  function option(id: string, title: string, line: string, count: number, areaIds: string[]) {
    const checked = selected.includes(id);
    return <Pressable key={id} accessibilityRole={buttons ? "button" : "checkbox"} accessibilityLabel={`${buttons && checked ? "✓ " : ""}${title}`} aria-pressed={buttons ? checked : undefined} aria-checked={buttons ? undefined : checked} onPress={() => onToggle(id)} style={[styles.option, id.startsWith("need:") && { flexGrow: 1, flexBasis: "46%" }, checked && styles.selected]}>
      <T variant="rowTitle" color={colors.foam}>{checked ? "✓ " : ""}{title}</T>
      {checked ? <T variant="small">{line}</T> : null}
      <T variant="meta">{count} session{count === 1 ? "" : "s"}</T>
      <T variant="meta" color={colors.gold}>In {pillars.filter(pillar => areaIds.includes(pillar.id)).map(pillar => pillar.name).join(" · ")}</T>
    </Pressable>;
  }
  return <View style={styles.group}>
    <T variant="small">Tap the needs you care about. Pick as many as you like.</T>
    <T variant="rowTitle" color={colors.gold}>Fields from {areas.length ? pillars.filter(pillar => areas.includes(pillar.id)).map(pillar => pillar.name).join(" · ") : "all infrastructure areas"}</T>
    <View testID="island-need-options" style={styles.grid}>
      {availableNeeds(sessions, areas).map(need => option(need.id, need.title, need.line, need.count, need.areaIds))}
    </View>
    <Pressable accessibilityRole="button" aria-expanded={specific} onPress={() => setSpecific(!specific)} style={styles.toggle}><T variant="button" color={colors.gold}>{specific ? "Hide specific fields" : "Show specific fields"}</T></Pressable>
    {specific ? <>
      <T variant="small">Add specific fields. Shared interests appear once, across all your selected areas.</T>
      <View testID="sub-infrastructure-options" style={styles.group}>{availableSubtopics(sessions, areas).map(topic => option(topic.id, topic.id, topic.line, topic.count, topic.areaIds))}</View>
    </> : null}
    <T variant="meta">Leave these blank to explore every field in your selected areas.</T>
    <Disclosure label="How your interests shape your trip"><T variant="small">We match sessions to any need or field you select, then suggest islands where those sessions take place. Choose a need to see what it covers.</T></Disclosure>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: 14 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, option: { minWidth: 110, padding: 12, gap: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,224,138,0.35)", backgroundColor: "rgba(7,27,42,0.86)" },
  selected: { borderColor: colors.gold, backgroundColor: "rgba(67,58,32,0.9)" }, toggle: { minHeight: 48, justifyContent: "center" },
});
