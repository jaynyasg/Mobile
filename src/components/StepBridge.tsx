import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { readIntake } from "@/logic/intake";
import { readOwnedPass } from "@/logic/ownedPass";
import { buildPath, pathDestination, type PathStep } from "@/logic/pathPlan";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { webStorage } from "@/welcome";
import { T } from "./Text";

const copy: Record<PathStep["id"] | "know", { title: string; line: string }> = {
  pass: {
    title: "First, your pass",
    line: "Tickets is the pass and where you buy it. Be on the Beach is the public ferry. Be on the Boat is a private day charter. Be on Board is the VIP charter you stay on for all 5 days. Tap a pass. You do not go back to Home between these steps.",
  },
  sessions: {
    title: "Next, your sessions",
    line: "These follow the infrastructure areas and the tech you picked. A tag shows the kind, such as EdTech, and whether the session is Problem, Plan, Build, or Showcase. Tap the card, not only the gold button.",
  },
  stay: {
    title: "Then, where you sleep",
    line: "Stays are suggested from the sessions you leaned toward. On St. Thomas the on-beach hotels are Emerald Beach Resort and Lindbergh Bay Hotel & Villas. Tap the card to open the island. Book on the hotel's own site. Prices are not listed here.",
  },
  route: {
    title: "Then, how you get there",
    line: "Boats are the only way from island to island. Be on the Beach uses public ferries. Be on the Boat is a private charter for the day. Be on Board is the VIP charter you stay on for all 5 days. A taxi stays on one island. Upgrade in Tickets if you want a different boat.",
  },
  chat: {
    title: "Then, the room",
    line: "Chat is the people at TATEL. Open it when you want to talk.",
  },
  know: {
    title: "Preparation guide",
    line: "Documents, money, driving, and the border, before you travel. Between islands you only go by boat: a public ferry on Be on the Beach, a day charter on Be on the Boat, or the 5-day VIP charter on Be on Board. A taxi stays on one island.",
  },
};

export function StepBridge({ id }: { id: PathStep["id"] | "know" }) {
  const router = useRouter();
  const { program } = useContent();
  const intake = readIntake(webStorage());
  const steps = intake
    ? buildPath(intake, program.forum.pillars, { completed: intake.completed, ownedPass: readOwnedPass(webStorage()) != null })
    : [];
  const index = steps.findIndex((step) => step.id === id);
  const next = index >= 0 ? steps[index + 1] : undefined;
  const block = copy[id];

  function goNext() {
    if (!next || !intake) return;
    const target = pathDestination(next.id, intake);
    router.push(target.params ? { pathname: target.pathname, params: target.params } : target.pathname);
  }

  return (
    <View style={styles.card}>
      <T variant="eyebrow" color={colors.gold}>{index >= 0 ? `Step ${steps[index]?.number}` : "Before you go"}</T>
      <T variant="rowTitle" color={colors.foam}>{block.title}</T>
      <T variant="small" color={colors.foam}>{block.line}</T>
      {next ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Continue to ${next.title}`} onPress={goNext} style={styles.next}>
          <T variant="button" color={colors.ink}>{`Continue · ${next.title}`}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, padding: 14, gap: 6, borderRadius: 18, ...nightGlass },
  next: { alignSelf: "flex-start", minHeight: 44, marginTop: 4, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
