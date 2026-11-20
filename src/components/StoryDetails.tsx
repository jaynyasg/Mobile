import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { zoneReelIds } from "@/content/reels";
import { availableNeeds, ISLAND_NEEDS } from "@/logic/islandNeeds";
import { availableSubtopics } from "@/logic/sessionGuide";
import { METHOD } from "@/logic/sessionJourney";
import { AREA_COPY, type Chapter } from "@/logic/tatelStory";
import { readIntake, writeIntake } from "@/logic/intake";
import { readTracks, writeTracks } from "@/guide/interests";
import { webStorage } from "@/welcome";
import { colors } from "@/theme";
import { IslandStory } from "./IslandStory";
import { T } from "./Text";

export type StoryArea = (typeof zoneReelIds)[number];

export function StoryDetails({ chapter, onAreaPick }: { chapter: Chapter; onAreaPick: (id: StoryArea) => void }) {
  return <View style={styles.body}>
    <T variant="body">{chapter.paragraphs[0]}</T>
    {chapter.id === "needs" ? <AreaChoices onPick={onAreaPick} /> : null}
    {chapter.id === "schedule" ? <StoryDays /> : null}
    {chapter.id === "islands" ? <IslandStory intro /> : null}
    {chapter.paragraphs.slice(1).map(line => <T variant="body" key={line}>{line}</T>)}
  </View>;
}

function AreaChoices({ onPick }: { onPick: (id: StoryArea) => void }) {
  const { program } = useContent();
  const [selected, setSelected] = useState(() => readIntake(webStorage())?.areas ?? readTracks(webStorage()));

  function toggle(id: StoryArea) {
    const next = selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
    const store = webStorage();
    const intake = readIntake(store);
    if (intake) {
      const fields = [...availableNeeds(program.sessions, next), ...availableSubtopics(program.sessions, next)];
      writeIntake(store, { ...intake, areas: next, interests: intake.interests.filter(field => fields.some(item => item.id === field)) });
    }
    writeTracks(store, next);
    setSelected(next);
    if (next.includes(id)) onPick(id);
  }

  return <View style={styles.body}>
    <T variant="rowTitle">Choose areas for my plan</T>
    {zoneReelIds.map(id => {
      const area = program.forum.pillars.find(item => item.id === id);
      if (!area) return null;
      const checked = selected.includes(id);
      return <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={area.name} aria-checked={checked} onPress={() => toggle(id)} style={[styles.option, checked && styles.selected]}>
        <T variant="rowTitle" color={colors.gold}>{checked ? "✓ " : ""}{area.name} · {area.island}</T>
        <T variant="small">{AREA_COPY[id].body}</T>
      </Pressable>;
    })}
    <T variant="rowTitle">Across the eight island needs</T>
    {ISLAND_NEEDS.map(need => <View key={need.id} style={styles.group}>
      <T variant="small" color={colors.gold}>{need.title}</T>
      <T variant="small">{need.line}</T>
    </View>)}
  </View>;
}

function StoryDays() {
  const { program: { forum, sessions } } = useContent();
  const [index, setIndex] = useState(0);
  const day = forum.days[index];
  if (!day) return null;
  const step = METHOD.find(item => item.phase === day.phase);
  const islands = [...new Set(sessions.filter(session => session.dayId === day.id).map(session => session.island))];
  return <View style={styles.body}>
    <View style={styles.days}>{forum.days.map((item, i) =>
      <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`January ${item.dayNumber}`} aria-pressed={i === index} onPress={() => setIndex(i)} style={[styles.day, i === index && styles.selected]}>
        <T variant="button" color={colors.gold}>Jan {item.dayNumber}</T>
      </Pressable>)}</View>
    <View accessibilityLiveRegion="polite" style={styles.group}>
      <T variant="title">{step?.title ?? day.phase}</T>
      {step ? <T variant="body">{step.line}</T> : null}
      <T variant="small">{islands.join(" · ")}</T>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  body: { gap: 16 }, group: { gap: 6 },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { padding: 14, gap: 6, borderColor: colors.inkSoft, borderWidth: 1, borderRadius: 12 },
  day: { paddingHorizontal: 12, justifyContent: "center", borderColor: colors.inkSoft, borderWidth: 1, borderRadius: 12, minHeight: 44 },
  selected: { borderColor: colors.gold, backgroundColor: colors.ink },
});
