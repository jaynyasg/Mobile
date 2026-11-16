import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useReels } from "@/reels/ReelHost";
import { webStorage } from "@/welcome";
import { colors } from "@/theme";
import { T } from "./Text";
import { nightGlass } from "./nightGlass";

const KEY = "tatel.experienceGuide.v1";
const stops = [
  { title: "Find the minds that light you up.", line: "Whose work makes you curious? Whose perspective could change your own? Explore the panelists, read their stories, and find their sessions. Turn admiration into a question—and a question into a conversation.", action: "Meet the panelists" },
  { title: "Break the ice before you arrive.", line: "Your next collaborator might also be your next great dinner conversation. Introduce yourself, share what you're working toward, and make plans with other guests. Sign in, then open Live chat from Community to join in.", action: "Open the community and chat" },
  { title: "Say yes to a little adventure.", line: "Save the sessions that move your goals forward. Then leave room for a swim, a new flavor, or a sunset with people you've just met. Be curious. Be present. Let the islands be part of what you take home.", action: "Find island experiences" },
  { title: "Five islands. A story only you can tell.", line: "Make your stamp card a record of the adventure. At each island event stop, scan the posted QR code or enter its short code. Every stamp marks somewhere you've been, something you've discovered, and another chapter of your TATEL.", action: "Show my stamp card" },
];

function savedStep(): number {
  const raw = webStorage()?.getItem(KEY);
  const step = Number(raw);
  return Number.isInteger(step) && step >= 0 && step <= stops.length ? step : 0;
}

export function ExperienceGuide({ onActivities, onStamps, onStepChange }: { onActivities: () => void; onStamps: () => void; onStepChange: () => void }) {
  const [step, setStep] = useState(savedStep);
  const { openChapter } = useReels();
  const current = stops[step];
  function go(next: number) {
    webStorage()?.setItem(KEY, String(next));
    setStep(next);
    onStepChange();
  }
  const actions = [() => openChapter("panelists", "/speakers"), () => openChapter("community", "/community"), onActivities, onStamps];
  return <View style={styles.card} testID="experience-guide">
    <T variant="eyebrow" color={colors.gold}>{current ? `Your island guide · ${step + 1} of 4` : "Make it your TATEL"}</T>
    <T variant="title">{current?.title ?? "You're ready to explore."}</T>
    <T variant="small">{current?.line ?? "Bring your ambition. Follow your curiosity. Leave room for a little magic. Your sessions give the trip purpose; the people and the islands make it unforgettable. Your guide is here whenever you need it."}</T>
    {step === 1 ? <T variant="meta" color={colors.gold}>Try an introduction: “I'm interested in ___ and would love to meet others working on it.”</T> : null}
    {step === 2 ? <T variant="meta" color={colors.gold}>Island outings may need a separate booking. Leave time for ferries, transfers, and getting back to your stay.</T> : null}
    {current ? <>
      <Pressable accessibilityRole="button" onPress={actions[step]} style={styles.primary}><T variant="button">{current.action}</T></Pressable>
      <View style={styles.row}>
        {step > 0 ? <Pressable accessibilityRole="button" onPress={() => go(step - 1)} style={styles.quiet}><T variant="button" color={colors.gold}>Previous guide stop</T></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => go(step + 1)} style={styles.quiet}><T variant="button" color={colors.gold}>{step === 3 ? "Let's explore" : `Next · ${["", "Chat", "Island time", "Stamp card"][step + 1]}`}</T></Pressable>
      </View>
    </> : <Pressable accessibilityRole="button" onPress={() => go(0)} style={styles.quiet}><T variant="button" color={colors.gold}>Replay my island guide</T></Pressable>}
    <View style={styles.links}>
      {[
        { label: "Panelists", action: actions[0] },
        { label: "Chat", action: actions[1] },
        { label: "Island ideas", action: onActivities },
        { label: "Stamp card", action: onStamps },
      ].map((item) => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`${item.label} from Explore`} onPress={item.action} style={styles.link}><T variant="button" color={colors.foam}>{item.label}</T></Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, padding: 18, gap: 12, borderRadius: 20, ...nightGlass },
  primary: { minHeight: 48, padding: 14, borderRadius: 24, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  quiet: { minHeight: 44, justifyContent: "center", paddingVertical: 10 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  link: { minHeight: 44, padding: 12, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,224,138,0.4)", justifyContent: "center" },
});
