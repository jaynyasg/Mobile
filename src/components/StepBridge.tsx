import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { confirmAccommodation, readIntake } from "@/logic/intake";
import { readOwnedPass } from "@/logic/ownedPass";
import { buildPath, pathDestination, type PathStep } from "@/logic/pathPlan";
import { useApp } from "@/store";
import { useReels } from "@/reels/ReelHost";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { webStorage } from "@/welcome";
import { T } from "./Text";

const copy: Record<PathStep["id"] | "know", { title: string; line: string }> = {
  pass: { title: "Your way into the extraordinary", line: "A base on the beach, days on the water, or life aboard a yacht. Find your kind of TATEL, then compare exactly what's included in each ticket." },
  stay: { title: "Somewhere beautiful to come back to", line: "A good day starts with a place that feels right. Choose your island, explore hotels and villas, and book directly with the property. Keep your session locations and travel times in mind." },
  sessions: { title: "Bring your spark. Give it a purpose.", line: "What could you help make happen here? Find your infrastructure areas, explore a specific field, and choose a goal. We'll connect those choices to sessions where your curiosity can become a contribution." },
  explore: { title: "Now make it yours", line: "Meet the speakers, connect with other guests, and discover the islands." },
  route: { title: "Plan your island connections", line: "Check ferry or charter departures between islands, then arrange taxis to and from the dock. Allow time for transfers and border clearance." },
  chat: { title: "Meet your fellow guests", line: "Join the community to share ideas and make plans together." },
  know: { title: "Arrive ready", line: "A practical guide to documents, money, local travel, and crossing between the U.S. and British Virgin Islands." },
};

export function StepBridge({ id, footer = false, onContinue }: { id: PathStep["id"] | "know"; footer?: boolean; onContinue?: () => void }) {
  const router = useRouter();
  const { openChapter } = useReels();
  const { program } = useContent();
  const { state } = useApp();
  const [intake, setIntake] = useState(() => readIntake(webStorage()));
  const refresh = useCallback(() => setIntake(readIntake(webStorage())), []);
  useFocusEffect(refresh);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("tatel-intake-changed", refresh);
    window.addEventListener("tatel-pass-owned", refresh);
    return () => { window.removeEventListener("tatel-intake-changed", refresh); window.removeEventListener("tatel-pass-owned", refresh); };
  }, [refresh]);
  const ownedTier = readOwnedPass(webStorage());
  const saved = state.favoriteIds.filter((sessionId) => program.sessions.some((session) => session.id === sessionId)).length;
  const steps = intake ? buildPath(intake, program.forum.pillars, { completed: intake.completed, ownedPass: ownedTier != null, ownedTier, savedSessionCount: saved }) : [];
  const index = steps.findIndex((step) => step.id === id);
  const current = steps[index];
  const next = steps.slice(index + 1).find((step) => !step.done);
  const complete = current?.done || (id === "pass" && (ownedTier != null || intake?.hasPass === "have")) || (id === "stay" && intake?.needsStay === "booked");
  const block = copy[id];
  function goNext() {
    const target = next ? pathDestination(next.id, intake ?? undefined) : { pathname: "/explore" as const };
    onContinue?.();
    if (target.pathname === "/tickets") openChapter("pass", target);
    else if (target.pathname === "/stays") openChapter("stays", target);
    else if (target.pathname === "/agenda") openChapter("sessions", target);
    else if (target.pathname === "/explore") openChapter("venues", target);
    else router.push(target);
  }
  if (footer) {
    if (!intake || !["pass", "stay", "sessions"].includes(id)) return null;
    return (
      <View style={styles.card} testID={`${id}-next-step`}>
        <T variant="eyebrow" color={colors.gold}>{complete ? "Ready for your next step" : "Your plan, at your pace"}</T>
        <T variant="rowTitle" color={colors.foam}>{id === "pass" ? complete ? "Your ticket is saved" : "Found your way to TATEL?" : id === "stay" ? complete ? "Your stay is arranged" : "Booked your accommodation?" : saved ? `${saved} session${saved === 1 ? "" : "s"} saved` : "Save the sessions you love"}</T>
        <T variant="small" color={colors.foam}>{id === "pass" ? complete ? "Continue with the rest of your visit." : "Choose a ticket above to book. You can also browse the next step and return to buy later." : id === "stay" ? complete ? intake.accommodation ? `${intake.accommodation.name} · ${intake.accommodation.island}` : "You're ready to choose your sessions." : "Finish your reservation with the property, then confirm here. Opening a hotel website does not book a room." : "Your saved sessions are in My schedule on this device. Check their times, locations, and travel connections before the summit."}</T>
        {id === "stay" && !complete ? <Pressable accessibilityRole="button" onPress={() => { confirmAccommodation(webStorage()); refresh(); }} style={styles.next}><T variant="button" color={colors.ink}>My accommodation is arranged</T></Pressable> : null}
        {id === "sessions" && saved > 0 ? <Pressable accessibilityRole="button" onPress={() => router.push("/schedule")} style={styles.quiet}><T variant="button" color={colors.gold}>Review My schedule</T></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={goNext} style={complete ? styles.next : styles.quiet}>
          <T variant="button" color={complete ? colors.ink : colors.gold}>{complete ? next ? `Continue · ${next.title}` : "Explore TATEL" : id === "pass" ? "I'll book my ticket later" : id === "stay" ? "I'll arrange my stay later" : "I'll save sessions later"}</T>
        </Pressable>
      </View>
    );
  }
  return <View style={styles.card}>
    <T variant="eyebrow" color={colors.gold}>{index >= 0 ? `Your visit · Step ${current.number} of ${steps.length}` : "Your TATEL guide"}</T>
    <T variant="rowTitle" color={colors.foam}>{block.title}</T>
    <T variant="small" color={colors.foam}>{block.line}</T>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, marginBottom: 12, padding: 18, gap: 10, borderRadius: 18, ...nightGlass },
  next: { alignSelf: "stretch", minHeight: 48, padding: 14, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  quiet: { minHeight: 44, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
});
