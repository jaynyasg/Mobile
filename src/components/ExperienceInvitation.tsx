import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useReels } from "@/reels/ReelHost";
import { colors } from "@/theme";
import { T } from "./Text";

export function ExperienceInvitation({ onStory }: { onStory: () => void }) {
  return <View style={styles.invitation} testID="experience-invitation">
    <View style={styles.masthead}>
      <T variant="eyebrow" color={colors.gold}>TATEL · The Virgin Islands</T>
      <T variant="meta">January 26–29, 2027</T>
    </View>
    <T variant="display" style={styles.title}>Make waves.</T>
    <T variant="display" color={colors.gold} style={styles.title}>Make it matter.</T>
    <T variant="body">Brilliant minds. Salt on your skin. Something worth building together.</T>
    <View style={styles.rule} />
    <T variant="small">TATEL is a four-day Technology Mill across the U.S. and British Virgin Islands. Identify real needs, shape solutions, build and test, then showcase what can grow. Island adventure and extraordinary company are part of the journey.</T>
    <Pressable accessibilityRole="button" accessibilityLabel="What is TATEL" onPress={onStory} style={styles.outline}>
      <T variant="button" color={colors.gold}>Step inside TATEL ↗</T>
    </Pressable>
  </View>;
}

const scenes = [
  { id: "work", label: "The work", photo: "/reels/sessions.jpg", alt: "A conversation on a waterfront deck at sunset", eyebrow: "Bring your ambition", title: "An idea with somewhere to go.", line: "Ask the question that matters. Find people who see it differently. Work toward a plan, a prototype, or a partnership—and choose sessions that help you get there.", action: "Find sessions with a purpose" },
  { id: "escape", label: "The escape", photo: "/reels/venues.jpg", alt: "The island setting of the TATEL experience", eyebrow: "Follow your curiosity", title: "Take the scenic route.", line: "Bare feet. Blue water. A different island on the horizon. Make room around your sessions for a swim, local flavors, and an adventure you'll still be talking about on the flight home.", action: "Discover the island life" },
  { id: "people", label: "The people", photo: "/reels/community.jpg", alt: "Guests sharing a toast and conversation by the sea", eyebrow: "Good company changes everything", title: "Dress up. Open up. Connect.", line: "Meet the mind behind a session. Start a conversation that outlasts the sunset. From a shared idea to a red-carpet screening, leave room for the people who make the whole trip come alive.", action: "Meet your fellow guests" },
] as const;

/** An invitation to explore the event's three sides, with a useful destination for each. */
export function ExperiencePreview() {
  const [selected, setSelected] = useState(0);
  const { openChapter } = useReels();
  const router = useRouter();
  const scene = scenes[selected];
  function enter() {
    if (scene.id === "work") openChapter("sessions", "/agenda");
    else if (scene.id === "people") openChapter("community", "/community");
    else router.push("/explore");
  }
  return <View style={styles.preview} testID="experience-preview">
    <View style={styles.heading}>
      <T variant="eyebrow" color={colors.gold}>Feel the rhythm</T>
      <T variant="title">A little ambition. A little abandon.</T>
    </View>
    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Discover the TATEL experience">
      {scenes.map((item, index) => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: selected === index }} onPress={() => setSelected(index)} style={[styles.tab, selected === index && styles.activeTab]}>
        <T variant="button" color={selected === index ? colors.gold : colors.foam}>{item.label}</T>
      </Pressable>)}
    </View>
    <View accessibilityLiveRegion="polite">
      <Image source={{ uri: scene.photo }} accessibilityLabel={scene.alt} style={styles.photo} resizeMode="cover" />
      <View style={styles.sceneCopy}>
        <T variant="eyebrow" color={colors.gold}>{scene.eyebrow}</T>
        <T variant="title">{scene.title}</T>
        <T variant="small">{scene.line}</T>
        <Pressable accessibilityRole="button" onPress={enter} style={styles.primary}><T variant="button">{scene.action} ↗</T></Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  invitation: { margin: 16, marginTop: 8, padding: 22, gap: 14, backgroundColor: "rgba(5,24,35,0.94)", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(255,224,138,0.65)" },
  masthead: { gap: 5, marginBottom: 12 },
  title: { fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  rule: { height: 1, width: 48, backgroundColor: colors.gold, marginVertical: 4 },
  outline: { alignSelf: "flex-start", minHeight: 48, justifyContent: "center", borderBottomWidth: 1, borderColor: colors.gold },
  preview: { margin: 16, marginTop: 20, backgroundColor: "#091D2B", borderRadius: 8, overflow: "hidden" },
  heading: { padding: 20, gap: 10 },
  tabs: { flexDirection: "row", paddingHorizontal: 12, borderBottomWidth: 1, borderColor: "rgba(255,224,138,0.25)" },
  tab: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 4, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderColor: "transparent" },
  activeTab: { borderColor: colors.gold },
  photo: { width: "100%", height: 250, backgroundColor: "#102F3E" },
  sceneCopy: { padding: 20, gap: 14 },
  primary: { alignSelf: "flex-start", minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, justifyContent: "center", backgroundColor: colors.gold },
});
