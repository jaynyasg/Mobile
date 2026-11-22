import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { readIntake, writeIntake } from "@/logic/intake";
import { useIntake } from "@/logic/useIntake";
import { availableSubtopics, guidedSessions, SESSION_GOALS, type SessionPreferences } from "@/logic/sessionGuide";
import { METHOD } from "@/logic/sessionJourney";
import { writeTracks, webTrackStore } from "@/guide/interests";
import { useApp } from "@/store";
import { webStorage } from "@/welcome";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { SessionRow } from "./SessionRow";
import { T } from "./Text";
import { availableNeeds } from "@/logic/islandNeeds";
import { InterestChoices } from "./InterestChoices";
import { AreaPostcards } from "./AreaPostcards";

export function SessionGuide({ onBrowse, onStepChange, onMatches }: { onBrowse: () => void; onStepChange: () => void; onMatches: () => void }) {
  const { program } = useContent();
  const { state } = useApp();
  const router = useRouter();
  const intake = useIntake();
  const savedPreferences = useMemo<SessionPreferences>(() => ({
    areas: [...(intake?.areas ?? [])],
    interests: intake?.interests ?? [],
    goals: SESSION_GOALS.filter((goal) => intake?.sessionGoals?.includes(goal.id)).map((goal) => goal.id),
  }), [intake]);
  const [step, setStep] = useState(3);
  const [preferences, setPreferences] = useState(savedPreferences);
  const [limit, setLimit] = useState(4);
  const [dayId, setDayId] = useState<string | null>(null);
  useEffect(() => {
    setPreferences(savedPreferences);
    setStep(3);
    setLimit(4);
    setDayId(null);
  }, [savedPreferences]);
  const matches = guidedSessions(program.sessions, preferences);
  const dayMatches = dayId ? matches.filter(session => session.dayId === dayId) : matches;
  const day = program.forum.days.find(day => day.id === dayId);
  const saved = state.favoriteIds.filter((id) => program.sessions.some((session) => session.id === id)).length;
  const titles = ["Start with your infrastructure areas", "Find your sub-infrastructure", "What do you want to accomplish?", "Your sessions"];
  function go(step: number) { setStep(step); onStepChange(); }

  function toggle(dimension: keyof SessionPreferences, id: string) {
    setPreferences((current) => {
      const values = current[dimension] as string[];
      const next = { ...current, [dimension]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id] } as SessionPreferences;
      if (dimension === "areas") {
        const available = [...availableSubtopics(program.sessions, next.areas), ...availableNeeds(program.sessions, next.areas)];
        next.interests = next.interests.filter((interest) => available.some((topic) => topic.id === interest));
      }
      return next;
    });
  }

  function showMatches() {
    const current = readIntake(webStorage());
    writeIntake(webStorage(), { ...(current ?? { hasPass: "skipped", needsStay: "skipped", completed: [] }), areas: preferences.areas, interests: preferences.interests, sessionGoals: preferences.goals, sessionGuideDone: true });
    writeTracks(webTrackStore(), preferences.areas);
    onMatches();
    setLimit(4);
    go(3);
  }

  function choice(id: string, title: string, line: string, dimension: keyof SessionPreferences, areaLabel?: string) {
    const selected = (preferences[dimension] as string[]).includes(id);
    return <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={title} accessibilityState={{ checked: selected }} aria-checked={selected} onPress={() => toggle(dimension, id)} style={[styles.option, selected && styles.selected]}>
      <T variant="rowTitle" color={colors.gold}>{selected ? "✓ " : ""}{title}</T>
      <T variant="small">{line}</T>
      {areaLabel ? <T variant="meta" color={colors.gold}>{areaLabel}</T> : null}
    </Pressable>;
  }

  return <View testID="session-guide">
    <View style={styles.card}>
      {step < 3 ? <T variant="eyebrow" color={colors.gold}>Your session guide · {step + 1} of 3</T> : null}
      <T variant="title">{titles[step]}</T>
      {step === 0 ? <>
        <T variant="small">Choose every area you want to explore.</T>
        <AreaPostcards pillars={program.forum.pillars} selected={preferences.areas} onToggle={id => toggle("areas", id)} />
      </> : null}
      {step === 1 ? <>
        <InterestChoices sessions={program.sessions} pillars={program.forum.pillars} areas={preferences.areas} selected={preferences.interests} onToggle={id => toggle("interests", id)} />
      </> : null}
      {step === 2 ? <>
        <T variant="small">Identify. Plan. Build. Showcase. Where would you like to contribute?</T>
        {SESSION_GOALS.map((goal) => choice(goal.id, goal.title, goal.line, "goals"))}
      </> : null}
      {step < 3 ? <>
        <T variant="meta" color={colors.gold}>Nothing selected means you're open to everything in this step.</T>
        <Pressable accessibilityRole="button" onPress={() => step === 2 ? showMatches() : go(step + 1)} style={styles.primary}><T variant="button">{step === 0 ? "Next · Find my sub-infrastructure" : step === 1 ? "Next · Choose my session goals" : "Show my session matches"}</T></Pressable>
        {step > 0 ? <Pressable accessibilityRole="button" onPress={() => go(step - 1)} style={styles.quiet}><T variant="button" color={colors.gold}>Back in session guide</T></Pressable> : null}
      </> : <>
        <T variant="small">{matches.length ? `${matches.length} ${preferences.areas.length || preferences.interests.length || preferences.goals.length ? "matches" : "sessions to explore"}. Tap a heart to save your favorites.` : "No sessions match that combination yet. Change your choices or browse the full program; your saved sessions are still safe."}</T>
        <Pressable accessibilityRole="button" onPress={() => go(0)} style={styles.edit}><T variant="button" color={colors.gold}>Change my session choices</T></Pressable>
      </>}
      {step < 3 || !matches.length ? <Pressable accessibilityRole="button" onPress={onBrowse} style={styles.quiet}><T variant="button" color={colors.gold}>Browse the full program</T></Pressable> : null}
    </View>
    {step === 3 ? <>
      <View style={styles.dayStrip} accessibilityLabel="Explore your matches by day">
        {[{ id: null, label: "All days" }, ...program.forum.days.map(day => ({ id: day.id, label: `Jan ${day.dayNumber}` }))].map(item => <Pressable key={item.id ?? "all"} accessibilityRole="button" accessibilityLabel={`Matching sessions · ${item.label}`} aria-pressed={dayId === item.id} onPress={() => { setDayId(item.id); setLimit(4); }} style={[styles.day, dayId === item.id && styles.selected]}><T variant="button" color={dayId === item.id ? colors.gold : colors.foam}>{item.label}</T></Pressable>)}
      </View>
      {day ? <View style={styles.dayCaption}><T variant="eyebrow" color={colors.gold}>{METHOD.find(step => step.phase === day.phase)?.short ?? day.phase} · {dayMatches.length} matches</T></View> : null}
      {dayMatches.slice(0, limit).map((session) => <SessionRow key={session.id} session={session} showOutcome />)}
      {day && !dayMatches.length ? <View style={styles.card}><T variant="small">No matching sessions on this day. Try another day or change your interests.</T></View> : null}
      <View style={styles.card}>
        {dayMatches.length > limit ? <Pressable accessibilityRole="button" onPress={() => setLimit(limit + 4)} style={styles.quiet}><T variant="button" color={colors.gold}>Show more matching sessions</T></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => go(2)} style={styles.quiet}><T variant="button" color={colors.gold}>Choose a session goal</T></Pressable>
        {matches.length ? <Pressable accessibilityRole="button" onPress={onBrowse} style={styles.quiet}><T variant="button" color={colors.gold}>Browse the full program</T></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push("/schedule")} style={styles.primary}><T variant="button">Review My schedule · {saved} saved</T></Pressable>
        <T variant="small">Check session times and island connections as you plan. Saving a session does not reserve a seat.</T>
        <T variant="small">Next: meet the panelists, start a conversation, and find your island adventure in Explore.</T>
      </View>
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, padding: 16, gap: 8, borderRadius: 20, ...nightGlass },
  edit: { minHeight: 44, justifyContent: "center" },
  dayStrip: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginHorizontal: 16, marginBottom: 12 },
  day: { minHeight: 44, paddingHorizontal: 10, justifyContent: "center", borderWidth: 1, borderColor: colors.inkSoft, borderRadius: 12, backgroundColor: colors.stage },
  dayCaption: { marginHorizontal: 16, marginBottom: 12 },
  option: { padding: 14, gap: 6, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,224,138,0.3)", backgroundColor: "rgba(7,27,42,0.8)" },
  selected: { borderColor: colors.gold, backgroundColor: "rgba(71,58,28,0.8)" },
  primary: { minHeight: 48, padding: 14, borderRadius: 24, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  quiet: { minHeight: 44, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
});
