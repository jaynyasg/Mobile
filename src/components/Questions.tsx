import { useState } from "react";
import { createPortal } from "react-dom";
import { Image, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { ticketGuide } from "@/content/tickets";
import { buildPath, type IntakeAnswers, type PassAnswer, type StayAnswer } from "@/logic/pathPlan";
import { type PassTier } from "@/logic/passPay";
import { availableSubtopics } from "@/logic/sessionGuide";
import { availableNeeds } from "@/logic/islandNeeds";
import { InterestChoices } from "./InterestChoices";
import { AreaPostcards } from "./AreaPostcards";
import { PlanTrail } from "./PlanTrail";
import { colors } from "@/theme";
import { notchPadding } from "./notch";
import { T } from "./Text";

type Answers = IntakeAnswers & { interests: string[] };
const experiences: { id: PassTier; title: string; line: string }[] = [
  { id: "beach", title: "Stay on land", line: "Land-based sessions. Arrange your own ferries if you visit another island." },
  { id: "boat", title: "Sail by day, stay on land", line: "A private day charter between islands, with your own hotel or villa at night." },
  { id: "vip", title: "Live aboard for five days", line: "An overnight charter for your group of eight, or a request to share a boat." },
];

export function Questions({ onDone, onSkip, initial, startAt = 0 }: { onDone: (answers: Answers) => void; onSkip: (answers: Answers) => void; initial?: Partial<Answers>; startAt?: number }) {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const [step, setStep] = useState(startAt);
  const [hasPass, setHasPass] = useState<PassAnswer>(initial?.hasPass ?? "skipped");
  const [ticketPreference, setTicketPreference] = useState<PassTier | undefined>(initial?.ticketPreference);
  const [needsStay, setNeedsStay] = useState<StayAnswer>(initial?.needsStay ?? "skipped");
  const [areas, setAreas] = useState<string[]>([...(initial?.areas ?? [])]);
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const answers = { hasPass, ticketPreference, needsStay, areas, interests };
  const path = buildPath(answers, program.forum.pillars);
  const nextLabel = step === 3 ? "Next · Find my sub-infrastructure" : step === 4 ? "See my plan" : path[0]?.id === "pass" ? (ticketPreference === "vip" ? "Start my Board booking" : ticketPreference ? "Continue to checkout" : "Compare tickets") : path[0]?.id === "stay" ? "Find my accommodation" : "Choose my sessions";
  const photo = step < 2 ? "/reels/pass.jpg" : step === 2 ? "/reels/stays.jpg" : "/reels/venues.jpg";
  const titles = ["Your way into TATEL.", hasPass === "have" ? "Which ticket do you have?" : "How will you island-hop?", "Where will you wake up?", "What sparks your ambition?", "What would you help change?", "Your plan for TATEL."];
  const toggle = (items: string[], item: string) => items.includes(item) ? items.filter((id) => id !== item) : [...items, item];
  function toggleArea(id: string) {
    const next = toggle(areas, id);
    const available = [...availableSubtopics(program.sessions, next), ...availableNeeds(program.sessions, next)];
    setAreas(next);
    setInterests((current) => current.filter((interest) => available.some((topic) => topic.id === interest)));
  }
  const option = (key: string, title: string, line: string, action: () => void, selected = false, image?: string) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }} aria-pressed={step === 3 || step === 4 ? selected : undefined} accessibilityLabel={title} onPress={action} style={[styles.tile, selected && styles.selected]}>
      {image ? <Image source={{ uri: image }} style={styles.choicePhoto} resizeMode="cover" /> : null}
      <View style={styles.choiceCopy}>
      <T variant="rowTitle" color={colors.foam}>{title}</T>
      {line ? <T variant="small" color={colors.foam}>{line}</T> : null}
      </View>
    </Pressable>
  );
  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="Plan your TATEL visit">
      <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
      <View style={styles.shade} />
      <View style={[styles.frame, notchPadding("top", 12, insets.top), notchPadding("bottom", 16, insets.bottom)]}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={step === 0} onPress={() => setStep(step - 1)} style={styles.ghost}><T variant="button" color={step === 0 ? colors.muted : colors.foam}>Back</T></Pressable>
          <T variant="meta" color={colors.gold}>{step + 1} of {titles.length}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Plan later" onPress={() => onSkip(answers)} style={styles.ghost}><T variant="button" color={colors.gold}>Plan later</T></Pressable>
        </View>
        <ScrollView key={step} style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 || step === 2 ? <Image source={{ uri: photo }} accessibilityLabel={step === 0 ? "Island life at TATEL" : "A coastal place to stay"} style={styles.scene} resizeMode="cover" /> : null}
          <T variant="eyebrow" color={colors.gold}>Your TATEL, your way</T>
          <T variant="title" color={colors.foam}>{titles[step]}</T>
          {step === 0 ? <>
            <T variant="small" color={colors.foam}>Ticket. Stay. Sessions. A few choices make this adventure yours.</T>
            {option("have", "Yes, I have a ticket", "", () => { setHasPass("have"); setStep(1); })}
            {option("not-yet", "I need a ticket", "", () => { setHasPass("not-yet"); setStep(1); })}
            {option("unsure", "I'd like to compare first", "", () => { setHasPass("unsure"); setStep(1); })}
          </> : null}
          {step === 1 ? <>
            <T variant="small" color={colors.foam}>{hasPass === "have" ? "Choose the name on your ticket." : "Ashore, on the water, or a yacht as home. Review prices and inclusions before booking."}</T>
            {experiences.map((experience) => option(experience.id, hasPass === "have" ? ticketGuide[experience.id].name : experience.title, experience.line, () => { setTicketPreference(experience.id); setStep(2); }, ticketPreference === experience.id, experience.id === "beach" ? "/reels/venues.jpg" : experience.id === "boat" ? "/reels/transport.jpg" : "/reels/pass.jpg"))}
            {option("compare", "I'm not sure yet", "", () => { setTicketPreference(undefined); setStep(2); })}
          </> : null}
          {step === 2 ? <>
            <T variant="small" color={colors.foam}>{ticketPreference === "vip" ? "Board includes your onboard stay. Need extra nights ashore?" : "Beach and Boat tickets need a separate place to stay."}</T>
            {option("yes", ticketPreference === "vip" ? "Find a hotel for extra nights" : "Help me find a place", "", () => { setNeedsStay("yes"); setStep(3); })}
            {option("booked", "My stay is already arranged", "Booked, staying with friends, or living locally.", () => { setNeedsStay("booked"); setStep(3); })}
            {option("browsing", ticketPreference === "vip" ? "I plan to stay aboard" : "I'd like to browse", "", () => { setNeedsStay("browsing"); setStep(3); })}
          </> : null}
          {step === 3 ? <>
            <T variant="small" color={colors.foam}>Tap every area that interests you. We'll connect you with its sessions and islands.</T>
            <AreaPostcards pillars={program.forum.pillars} selected={areas} onToggle={toggleArea} buttons />
            <T variant="meta">No picks? Keep every area open.</T>
          </> : null}
          {step === 4 ? <>
            <InterestChoices sessions={program.sessions} pillars={program.forum.pillars} areas={areas} selected={interests} onToggle={id => setInterests(toggle(interests, id))} buttons />
          </> : null}
          {step === 5 ? <>
            <T variant="small" color={colors.foam}>Your plan, based on your choices. Follow it at your pace; edit it from Home.</T>
            {ticketPreference && hasPass === "have" ? <T variant="rowTitle" color={colors.gold}>Your ticket: {ticketGuide[ticketPreference].name}</T> : null}
            <View testID="opening-step-plan" style={styles.plan}>
              <PlanTrail steps={path} />
            </View>
          </> : null}
        </ScrollView>
        {step >= 3 ? <Pressable accessibilityRole="button" accessibilityLabel={nextLabel} onPress={() => step < 5 ? setStep(step + 1) : onDone(answers)} style={styles.next}><T variant="button" color={colors.ink}>{nextLabel}</T></Pressable> : null}
      </View>
    </View>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}

const styles = StyleSheet.create({
  overlay: { ...({ position: "fixed" } as unknown as ViewStyle), inset: 0, zIndex: 95, backgroundColor: "#071421" },
  photo: { position: "absolute", inset: 0 },
  shade: { position: "absolute", inset: 0, backgroundColor: "rgba(6,14,24,0.76)" },
  frame: { flex: 1, minHeight: 0, paddingHorizontal: 20, gap: 12, width: "100%", maxWidth: 640, alignSelf: "center" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  ghost: { minHeight: 44, justifyContent: "center" },
  scroll: { flex: 1, minHeight: 0 },
  body: { gap: 14, paddingVertical: 12, paddingBottom: 24 },
  plan: { gap: 14 },
  tile: { flexDirection: "row", overflow: "hidden", borderRadius: 16, backgroundColor: "rgba(7,27,42,0.86)", borderWidth: 1, borderColor: "rgba(255,224,138,0.35)" },
  choiceCopy: { flex: 1, minWidth: 0, padding: 16, gap: 6 },
  choicePhoto: { width: 76, height: "100%", minHeight: 110 },
  scene: { height: 156, width: "100%", borderRadius: 12 },
  selected: { borderColor: colors.gold, backgroundColor: "rgba(67,58,32,0.9)" },
  next: { minHeight: 52, padding: 14, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
