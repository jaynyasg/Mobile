import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useReels } from "@/reels/ReelHost";
import { webStorage } from "@/welcome";
import { colors } from "@/theme";
import { T } from "./Text";
import { nightGlass } from "./nightGlass";

const KEY = "tatel.experienceGuide.v1";
const stops = [
  { title: "Find your people.", photo: "/reels/panelists.jpg", line: "Meet the minds behind the sessions. Find a perspective that sparks yours.", action: "Meet the panelists" },
  { title: "Start with a hello.", photo: "/reels/community.jpg", line: "Share what you're working on. Sign in and open Live chat to meet other guests.", action: "Open the community and chat" },
  { title: "Leave room for adventure.", photo: "/reels/venues.jpg", line: "A reef, a beach, a new flavor. Discover the islands between sessions.", action: "Find island experiences" },
  { title: "Collect your island memories.", photo: "/reels/transport.jpg", line: "Visit an event stop. Scan its code. Add a stamp to your island passport.", action: "Show my stamp card" },
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
    {current ? <Image source={{ uri: current.photo }} style={{ width: "100%", height: 180, borderRadius: 8 }} resizeMode="cover" /> : null}
    <T variant="eyebrow" color={colors.gold}>{current ? `Your island guide · ${step + 1} of 4` : "Make it your TATEL"}</T>
    <T variant="title">{current?.title ?? "You're ready to explore."}</T>
    <T variant="small">{current?.line ?? "Your people. Your island moments. Choose where to go next."}</T>
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
