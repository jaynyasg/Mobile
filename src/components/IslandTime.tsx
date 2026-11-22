import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";
import { ExternalLink } from "./ExternalLink";

// Destination details: official USVI and BVI visitor guides, checked November 2026.
const moments = [
  { label: "Beach", island: "St. Thomas", title: "A Magens Bay afternoon.", line: "Make time for a swim in the sheltered bay and a walk along the sand.", photo: "/reels/tech-poster.jpg", url: "https://www.visitusvi.com/experience/magens-bay-beach/" },
  { label: "Reef", island: "St. John", title: "Follow the reef at Trunk Bay.", line: "Discover the marked underwater snorkeling trail in Virgin Islands National Park.", photo: "/reels/ai-poster.jpg", url: "https://www.visitusvi.com/experience/explore-trunk-bay-beach-st-john/" },
  { label: "Culture", island: "Tortola", title: "Meet the island beyond the marina.", line: "Explore Tortola's history at the Lower Estate Sugar Works Museum or Mount Healthy Windmill.", photo: "/reels/venues.jpg", url: "https://www.bvitourism.com/the-islands/tortola" },
  { label: "On the water", island: "British Virgin Islands", title: "Let the horizon set the mood.", line: "Explore day sails, snorkeling, and local operators through the BVI visitor guide.", photo: "/reels/transport.jpg", url: "https://www.bvitourism.com/" },
];

export function IslandTime() {
  const [index, setIndex] = useState(0);
  const moment = moments[index];
  return <View style={styles.card} testID="island-time">
    <View style={styles.copy}><T variant="eyebrow" color={colors.gold}>Beyond the sessions</T><T variant="title">Make room for island time</T>
      <View style={styles.tabs}>{moments.map((item, i) => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`Island time · ${item.label}`} aria-pressed={index === i} onPress={() => setIndex(i)} style={[styles.tab, index === i && styles.selected]}><T variant="button" color={index === i ? colors.ink : colors.foam}>{item.label}</T></Pressable>)}</View>
    </View>
    <Image source={{ uri: moment.photo }} style={styles.photo} resizeMode="cover" accessibilityLabel="Island scenes from the TATEL collection" />
    <View key={moment.label} style={styles.copy} accessibilityLiveRegion="polite">
      <T variant="eyebrow" color={colors.gold}>{moment.island}</T><T variant="title">{moment.title}</T><T variant="small">{moment.line}</T>
      <ExternalLink href={moment.url} label={`Visitor guide: ${moment.island}`}>Open the official visitor guide ↗</ExternalLink>
      <T variant="meta">Independent outing · Check access, conditions, costs, and your return transport. Photo: TATEL island inspiration.</T>
    </View>
  </View>;
}
const styles = StyleSheet.create({ card: { margin: 16, borderRadius: 8, overflow: "hidden", backgroundColor: colors.stage }, copy: { padding: 20, gap: 12 }, photo: { height: 210, width: "100%" }, tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, tab: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: colors.inkSoft }, selected: { backgroundColor: colors.gold, borderColor: colors.gold } });
