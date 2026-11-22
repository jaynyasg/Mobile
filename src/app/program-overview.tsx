import { useState } from "react";
import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { Disclosure } from "@/components/Disclosure";
import { nightGlass } from "@/components/nightGlass";
import { METHOD } from "@/logic/sessionJourney";
import { colors } from "@/theme";

export default function ProgramOverview() {
  const { program } = useContent();
  const [index, setIndex] = useState(0);
  const day = program.forum.days[index];
  const method = METHOD.find(step => step.phase === day?.phase);
  const sessions = program.sessions.filter(session => session.dayId === day?.id);
  return <Screen edge="none"><StackHeader title="Your four-day experience" />
    <View style={styles.card}><T variant="eyebrow" color={colors.gold}>January 26–29, 2027</T><T variant="title">One idea. Four days to move it forward.</T><T variant="small">Choose a day to see how the work unfolds.</T>
      <View style={styles.days}>{program.forum.days.map((item, i) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`January ${item.dayNumber}`} aria-pressed={index === i} onPress={() => setIndex(i)} style={[styles.day, index === i && styles.selected]}><T variant="eyebrow" color={index === i ? colors.ink : colors.gold}>Jan</T><T variant="title" color={index === i ? colors.ink : colors.foam}>{item.dayNumber}</T></Pressable>)}</View>
    </View>
    {day ? <View style={styles.feature} accessibilityLiveRegion="polite">
      <Image source={{ uri: ["/reels/community.jpg", "/reels/sessions.jpg", "/reels/tech-poster.jpg", "/reels/venues.jpg"][index % 4] }} style={styles.photo} resizeMode="cover" />
      <View style={styles.copy}><T variant="eyebrow" color={colors.gold}>{day.weekday} · January {day.dayNumber}</T><T variant="title">{method?.title ?? day.phase}</T><T variant="small">{method?.line}</T>
        <T variant="meta">{sessions.length} sessions · {new Set(sessions.map(session => session.island)).size} island areas</T>
        <Link href={{ pathname: "/agenda", params: { day: day.id } }} asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Explore this day's sessions</T></Pressable></Link>
        <Disclosure key={day.id} label="Islands & planning details"><T variant="small">{[...new Set(sessions.map(session => session.island))].join(" · ")}</T><T variant="small">Exact venues and some times are being confirmed. Match your sessions to your ticket's transport and allow time between islands.</T></Disclosure>
      </View>
    </View> : null}
    <View style={styles.card}>
      <Link href="/stays" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Explore accommodation options</T></Pressable></Link>
      <Link href="/routes" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Plan island connections</T></Pressable></Link>
      <Link href="/work" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Carry the work forward</T></Pressable></Link>
    </View>
  </Screen>;
}
const styles = StyleSheet.create({ card: { margin: 16, padding: 18, gap: 12, borderRadius: 18, ...nightGlass }, feature: { margin: 16, borderRadius: 8, overflow: "hidden", backgroundColor: colors.stage }, photo: { width: "100%", height: 210 }, copy: { padding: 20, gap: 12 }, days: { flexDirection: "row", gap: 8 }, day: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 80, borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.inkSoft }, selected: { backgroundColor: colors.gold, borderColor: colors.gold }, link: { minHeight: 48, justifyContent: "center" } });
