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
  const titles = ["Your invitation to something extraordinary.", hasPass === "have" ? "Which ticket do you have?" : "How do you want to experience it?", "Where will you wake up?", "What sparks your ambition?", "Where do you want to make waves?", "Your plan for TATEL."];
  const toggle = (items: string[], item: string) => items.includes(item) ? items.filter((id) => id !== item) : [...items, item];
  function toggleArea(id: string) {
    const next = toggle(areas, id);
    const available = [...availableSubtopics(program.sessions, next), ...availableNeeds(program.sessions, next)];
    setAreas(next);
    setInterests((current) => current.filter((interest) => available.some((topic) => topic.id === interest)));
  }
  const option = (key: string, title: string, line: string, action: () => void, selected = false, areaLabel?: string) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }} aria-pressed={step === 3 || step === 4 ? selected : undefined} accessibilityLabel={title} onPress={action} style={[styles.tile, selected && styles.selected]}>
      <T variant="rowTitle" color={colors.foam}>{title}</T>
      <T variant="small" color={colors.foam}>{line}</T>
      {areaLabel ? <T variant="meta" color={colors.gold}>{areaLabel}</T> : null}
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
          <T variant="eyebrow" color={colors.gold}>Your TATEL, your way</T>
          <T variant="title" color={colors.foam}>{titles[step]}</T>
          {step === 0 ? <>
            <T variant="small" color={colors.foam}>Bold ideas, beautiful islands, and people you'll want to know. Let's shape your way into it: your ticket, your stay, then sessions with a purpose. Do you already have a TATEL ticket?</T>
            {option("have", "Yes, I have a ticket", "We'll help with the rest of your visit.", () => { setHasPass("have"); setStep(1); })}
            {option("not-yet", "I need a ticket", "Find the experience that fits you.", () => { setHasPass("not-yet"); setStep(1); })}
            {option("unsure", "I'd like to compare first", "See what each ticket offers before deciding.", () => { setHasPass("unsure"); setStep(1); })}
          </> : null}
          {step === 1 ? <>
            <T variant="small" color={colors.foam}>{hasPass === "have" ? "Choose the name on your ticket so we can shape the rest of your experience." : "Picture your kind of island life: a beautiful base ashore, days sailing between sessions, or five days with the yacht as home. See the full details and price before booking."}</T>
            {experiences.map((experience) => option(experience.id, hasPass === "have" ? ticketGuide[experience.id].name : experience.title, `${ticketGuide[experience.id].name} · ${experience.line}`, () => { setTicketPreference(experience.id); setStep(2); }, ticketPreference === experience.id))}
            {option("compare", "I'm not sure yet", "Keep all three tickets in view.", () => { setTicketPreference(undefined); setStep(2); })}
          </> : null}
          {step === 2 ? <>
            <T variant="small" color={colors.foam}>{ticketPreference === "vip" ? "Be on Board includes an onboard stay. You can still browse hotels for extra nights before or after the charter." : "Beach and day-charter guests arrange their own accommodation. We can help you choose an island and find a hotel or villa."}</T>
            {option("yes", ticketPreference === "vip" ? "Find a hotel for extra nights" : "Help me find a place", "Browse islands, then book directly with your chosen property.", () => { setNeedsStay("yes"); setStep(3); })}
            {option("booked", "My stay is already arranged", "I have a booking, live locally, or am staying with someone.", () => { setNeedsStay("booked"); setStep(3); })}
            {option("browsing", ticketPreference === "vip" ? "I plan to stay aboard" : "I'd like to browse", ticketPreference === "vip" ? "We'll focus on your charter first. Extra hotel nights are optional." : "Explore the options and decide later.", () => { setNeedsStay("browsing"); setStep(3); })}
          </> : null}
          {step === 3 ? <>
            <T variant="small" color={colors.foam}>Pick the infrastructure areas that excite you. Next, choose the fields within them. We'll use both to suggest islands for your stay and sessions you can save. Leave these blank if you're open to everything.</T>
            {program.forum.pillars.map((pillar) => option(pillar.id, `${areas.includes(pillar.id) ? "✓ " : ""}${pillar.name}`, `Home area · ${pillar.island}`, () => toggleArea(pillar.id), areas.includes(pillar.id)))}
          </> : null}
          {step === 4 ? <>
            <InterestChoices sessions={program.sessions} pillars={program.forum.pillars} areas={areas} selected={interests} onToggle={id => setInterests(toggle(interests, id))} buttons />
          </> : null}
          {step === 5 ? <>
            <T variant="small" color={colors.foam}>This is your plan, based on your choices. We'll guide you through these steps in order. Your answers are saved on this device; you can change them from Home.</T>
            {ticketPreference && hasPass === "have" ? <T variant="rowTitle" color={colors.gold}>Your ticket: {ticketGuide[ticketPreference].name}</T> : null}
            <View testID="opening-step-plan" style={styles.plan}>
              {path.map((item) => <View key={item.id} style={styles.tile}><T variant="rowTitle" color={colors.foam}>{item.number}. {item.title}</T><T variant="small" color={colors.foam}>{item.line}</T></View>)}
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
  tile: { padding: 18, gap: 6, borderRadius: 16, backgroundColor: "rgba(7,27,42,0.86)", borderWidth: 1, borderColor: "rgba(255,224,138,0.35)" },
  selected: { borderColor: colors.gold, backgroundColor: "rgba(67,58,32,0.9)" },
  next: { minHeight: 52, padding: 14, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
