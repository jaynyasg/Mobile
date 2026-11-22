import { Image, Pressable, StyleSheet, View } from "react-native";
import { reels } from "@/content/reels";
import type { PathStep } from "@/logic/pathPlan";
import { colors } from "@/theme";
import { T } from "./Text";

const photos = { pass: reels.pass.poster, stay: reels.stays.poster, sessions: reels.sessions.poster, explore: reels.venues.poster, route: reels.transport.poster, chat: reels.community.poster };

export function PlanTrail({ steps, onOpen }: { steps: PathStep[]; onOpen?: (step: PathStep) => void }) {
  const next = steps.find(step => !step.done);
  return <View style={styles.trail}>
    {steps.map(step => {
      const content = <>
        <Image source={{ uri: photos[step.id] }} style={styles.photo} resizeMode="cover" />
        <View style={styles.copy}>
          <T variant="eyebrow" color={colors.gold}>{step.done ? "✓ Complete" : `${step.number}${step.id === next?.id ? " · Up next" : ""}`}</T>
          <T variant="rowTitle">{step.title}</T>
          {step.id === next?.id ? <T variant="small">{step.line}</T> : null}
        </View>
      </>;
      return onOpen ? <Pressable key={step.id} accessibilityRole="button" accessibilityLabel={step.done ? `${step.title}, completed` : step.title} onPress={() => onOpen(step)} style={[styles.stop, step.id === next?.id && styles.next]}>{content}</Pressable> : <View key={step.id} style={[styles.stop, step.id === next?.id && styles.next]}>{content}</View>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  trail: { gap: 12 }, stop: { flexDirection: "row", overflow: "hidden", borderRadius: 12, backgroundColor: colors.stage, borderWidth: 1, borderColor: colors.inkSoft },
  next: { borderColor: colors.gold }, photo: { width: 76, minHeight: 94, height: "100%" }, copy: { flex: 1, minWidth: 0, padding: 14, gap: 5 },
});
