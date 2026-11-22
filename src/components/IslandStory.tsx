import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { useContent } from "@/content/provider";
import { colors } from "@/theme";
import { T } from "./Text";
import { Disclosure } from "./Disclosure";

const islands = [
  { name: "St. Thomas", region: "U.S. Virgin Islands", place: "ritz-carlton-st-thomas", line: "Start with a big idea. Stay for the sea, the food, and the people who make an introduction feel like an invitation.", role: "T · Tech: digital systems that can be built locally and grow beyond the islands." },
  { name: "St. John", region: "U.S. Virgin Islands", place: "gallows-point-resort", line: "Make room for blue water and a slower moment between conversations. Let the setting open up a different way of thinking.", role: "A · AI: local knowledge, practical applications, and people working together." },
  { name: "Lovango", region: "U.S. Virgin Islands", place: "lovango-resort-beach-club", line: "A conversation across the table. Another island across the water. Bring curiosity to both.", role: "L · Law: the frameworks for products, investment, and ownership to take root." },
  { name: "Scrub Island", region: "British Virgin Islands", place: "scrub-island-resort", line: "Hospitality and the journey become part of the work. Explore how a memorable welcome can become lasting opportunity.", role: "T · Travel: how people are hosted and move around the islands." },
  { name: "Around Tortola", region: "British Virgin Islands", place: null, line: "Culture, stories, and creative ambition belong at the heart of this adventure. Connect with the people shaping what comes next.", role: "E · Entertainment: near Tortola. The exact venue, landing point, and transfers are being confirmed." },
  { name: "St. Croix", region: "The wider Virgin Islands story", place: null, line: "The story reaches beyond the summit. Discover more of the Virgin Islands' people, culture, food, and coastal life in your own time.", role: "St. Croix is not a TATEL program stop. Any visit is an independent extension of your trip." },
];

/** Manual navigation keeps the destination story readable without compulsory motion. */
export function IslandStory({ intro = false }: { intro?: boolean }) {
  const [index, setIndex] = useState(0);
  const { program } = useContent();
  const island = islands[index];
  const place = program.places.find(item => item.id === island.place);
  const photo = place?.photos.find(item => item.hero);
  const pillar = program.forum.pillars.find(item => item.island === island.name || island.name === "Around Tortola" && item.id === "entertainment");
  return <View style={[styles.card, intro && { margin: 0 }]} testID="island-story">
    {!intro ? <View style={styles.copy}><T variant="eyebrow" color={colors.gold}>Your island stories</T><T variant="title">Where will curiosity take you?</T>
      <View style={styles.choices}>{islands.map((item, i) => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={`Discover ${item.name}`} aria-pressed={index === i} onPress={() => setIndex(i)} style={[styles.choice, index === i && styles.chosen]}><T variant="button" color={index === i ? colors.ink : colors.foam}>{item.name}</T></Pressable>)}</View>
    </View> : null}
    {photo ? <Image source={{ uri: photo.webp1280 }} accessibilityLabel={`${place?.name}, ${island.name}`} style={styles.photo} resizeMode="cover" /> : null}
    <View style={styles.copy} accessibilityLiveRegion="polite"><T variant="eyebrow" color={colors.gold}>{index + 1} of {islands.length} · {island.region}</T><T variant="title">{island.name}</T>
      {intro ? <><T variant="small">{island.line}</T><T variant="small">{island.role}</T></> : <T variant="small">{island.role}</T>}
      {photo ? <T variant="meta">Pictured: {place?.name}{intro ? ". Confirm your venue and reservation before travel." : ""}</T> : null}
      {!intro && pillar ? <Link href={{ pathname: "/pillar/[id]", params: { id: pillar.id } }} asChild><Pressable accessibilityRole="button" style={styles.button}><T variant="button" color={colors.gold}>Explore {pillar.name} on this island ↗</T></Pressable></Link> : null}
      {!intro ? <Disclosure key={island.name} label="The island story"><T variant="small">{island.line}</T></Disclosure> : null}
      <View style={styles.navigation}>{[-1, 1].map(direction => <Pressable key={direction} accessibilityRole="button" accessibilityLabel={direction < 0 ? "Previous island" : "Next island"} onPress={() => setIndex((index + direction + islands.length) % islands.length)} style={styles.button}><T variant="button" color={colors.gold}>{direction < 0 ? "← Previous" : "Next →"}</T></Pressable>)}</View>
      {!intro ? <Link href="/program-overview" asChild><Pressable accessibilityRole="button" style={styles.button}><T variant="button" color={colors.gold}>See the four-day experience</T></Pressable></Link> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({ card: { margin: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#091D2B" }, copy: { padding: 20, gap: 14 }, photo: { height: 230, width: "100%" }, navigation: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, button: { minHeight: 48, justifyContent: "center", flexShrink: 1 }, choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, choice: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, justifyContent: "center", borderWidth: 1, borderColor: colors.inkSoft }, chosen: { backgroundColor: colors.gold, borderColor: colors.gold } });
