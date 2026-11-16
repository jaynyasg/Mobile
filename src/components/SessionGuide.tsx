import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { readIntake, writeIntake } from "@/logic/intake";
import { availableSubtopics, guidedSessions, SESSION_GOALS, type SessionPreferences } from "@/logic/sessionGuide";
import { AREA_COPY } from "@/logic/tatelStory";
import { writeTracks, webTrackStore } from "@/guide/interests";
import { useApp } from "@/store";
import { webStorage } from "@/welcome";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { SessionRow } from "./SessionRow";
import { T } from "./Text";

export function SessionGuide({ onBrowse, onStepChange, onMatches }: { onBrowse: () => void; onStepChange: () => void; onMatches: () => void }) {
  const { program } = useContent();
  const { state } = useApp();
  const router = useRouter();
  const [initial] = useState(() => readIntake(webStorage()));
  const [step, setStep] = useState(initial?.sessionGuideDone ? 3 : 0);
  const [preferences, setPreferences] = useState<SessionPreferences>(() => ({
    areas: (initial?.areas ?? []).filter((id) => program.forum.pillars.some((pillar) => pillar.id === id)),
    interests: (initial?.interests ?? []).filter((id) => availableSubtopics(program.sessions, initial?.areas ?? []).some((topic) => topic.id === id)),
    goals: SESSION_GOALS.filter((goal) => initial?.sessionGoals?.includes(goal.id)).map((goal) => goal.id),
  }));
  const [limit, setLimit] = useState(4);
  const topics = availableSubtopics(program.sessions, preferences.areas);
  const matches = guidedSessions(program.sessions, preferences);
  const saved = state.favoriteIds.filter((id) => program.sessions.some((session) => session.id === id)).length;
  const titles = ["Start with your infrastructure areas", "Find your sub-infrastructure", "What do you want to accomplish?", "Sessions for your kind of TATEL"];
  function go(step: number) { setStep(step); onStepChange(); }

  function toggle(dimension: keyof SessionPreferences, id: string) {
    setPreferences((current) => {
      const values = current[dimension] as string[];
      const next = { ...current, [dimension]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id] } as SessionPreferences;
      if (dimension === "areas") {
        const available = availableSubtopics(program.sessions, next.areas);
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

  function choice(id: string, title: string, line: string, dimension: keyof SessionPreferences) {
    const selected = (preferences[dimension] as string[]).includes(id);
    return <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={title} accessibilityState={{ checked: selected }} onPress={() => toggle(dimension, id)} style={[styles.option, selected && styles.selected]}>
      <T variant="rowTitle" color={colors.gold}>{selected ? "✓ " : ""}{title}</T>
      <T variant="small">{line}</T>
    </Pressable>;
  }

  return <View testID="session-guide">
    <View style={styles.card}>
      <T variant="eyebrow" color={colors.gold}>{step < 3 ? `Your session guide · ${step + 1} of 3` : "Your session matches"}</T>
      <T variant="title">{titles[step]}</T>
      {step === 0 ? <>
        <T variant="small">TATEL connects five infrastructure areas: Tech, AI, Travel, Entertainment, and Law. Pick the worlds you want to explore. You can choose more than one.</T>
        {program.forum.pillars.map((pillar) => choice(pillar.id, pillar.name, AREA_COPY[pillar.id as keyof typeof AREA_COPY]?.body ?? `Explore sessions in ${pillar.name}.`, "areas"))}
      </> : null}
      {step === 1 ? <>
        <T variant="small">Sub-infrastructure means a more specific field, such as AgriTech for food systems or FilmTech for filmmaking. These options have sessions in your chosen areas; a field may connect several areas.</T>
        {topics.map((topic) => choice(topic.id, topic.id, `${topic.line} · ${topic.count} sessions`, "interests"))}
      </> : null}
      {step === 2 ? <>
        <T variant="small">Give your ambition a direction. Each summit day moves the work forward: understand, plan, build, then showcase. Choose what you'd love to accomplish, or make the whole journey part of your experience.</T>
        {SESSION_GOALS.map((goal) => choice(goal.id, goal.title, goal.line, "goals"))}
      </> : null}
      {step < 3 ? <>
        <T variant="meta" color={colors.gold}>Nothing selected means you're open to everything in this step.</T>
        <Pressable accessibilityRole="button" onPress={() => step === 2 ? showMatches() : go(step + 1)} style={styles.primary}><T variant="button">{step === 0 ? "Next · Find my sub-infrastructure" : step === 1 ? "Next · Choose my session goals" : "Show my session matches"}</T></Pressable>
        {step > 0 ? <Pressable accessibilityRole="button" onPress={() => go(step - 1)} style={styles.quiet}><T variant="button" color={colors.gold}>Back in session guide</T></Pressable> : null}
      </> : <>
        <T variant="small">{matches.length ? `${matches.length} sessions match your choices. Read what you'll work toward, then tap the heart to save the ones you love.` : "No sessions match that combination yet. Change your choices or browse the full program; your saved sessions are still safe."}</T>
        <T variant="meta" color={colors.gold}>{[
          ...program.forum.pillars.filter((pillar) => preferences.areas.includes(pillar.id)).map((pillar) => pillar.name),
          ...preferences.interests,
          ...SESSION_GOALS.filter((goal) => preferences.goals.includes(goal.id)).map((goal) => goal.title),
        ].join(" · ") || "All infrastructure areas, fields, and goals"}</T>
        <T variant="small">Build a schedule with ambition and breathing room. Make progress on something you care about, then make time for the people, the water, and the unexpected. Check session times and boat connections; saving a session does not reserve a seat.</T>
        <Pressable accessibilityRole="button" onPress={() => go(0)} style={styles.quiet}><T variant="button" color={colors.gold}>Change my session choices</T></Pressable>
      </>}
      <Pressable accessibilityRole="button" onPress={onBrowse} style={styles.quiet}><T variant="button" color={colors.gold}>Browse the full program</T></Pressable>
    </View>
    {step === 3 ? <>
      {matches.slice(0, limit).map((session) => <SessionRow key={session.id} session={session} showOutcome />)}
      <View style={styles.card}>
        {matches.length > limit ? <Pressable accessibilityRole="button" onPress={() => setLimit(limit + 4)} style={styles.quiet}><T variant="button" color={colors.gold}>Show more matching sessions</T></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push("/schedule")} style={styles.primary}><T variant="button">Review My schedule · {saved} saved</T></Pressable>
        <T variant="small">Your ambition has a place in the program. Now find your people and your next adventure. Continue from My schedule to the panelists, Chat, and your island guide in Explore.</T>
      </View>
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, padding: 18, gap: 12, borderRadius: 20, ...nightGlass },
  option: { padding: 14, gap: 6, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,224,138,0.3)", backgroundColor: "rgba(7,27,42,0.8)" },
  selected: { borderColor: colors.gold, backgroundColor: "rgba(71,58,28,0.8)" },
  primary: { minHeight: 48, padding: 14, borderRadius: 24, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  quiet: { minHeight: 44, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
});
