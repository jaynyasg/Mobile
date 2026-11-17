import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import { METHOD } from "@/logic/sessionJourney";
import { colors } from "@/theme";
export default function ProgramOverview() {
  const { program } = useContent();
  return <Screen edge="none"><StackHeader title="Your four-day experience" />
    <View style={styles.card}><T variant="eyebrow" color={colors.gold}>January 26–29, 2027</T><T variant="title">Four days. Work with a future.</T><T variant="small">Connected sessions take an island challenge through the full TATEL method. Follow a series, meet the people building it, and leave with a next step. Exact venues and some times are still being confirmed.</T></View>
    {program.forum.days.map(day => <View key={day.id} style={styles.card}><T variant="eyebrow" color={colors.gold}>{day.weekday} · January {day.dayNumber}</T><T variant="title">{METHOD.find(step => step.phase === day.phase)?.title ?? day.phase}</T><T variant="small">{METHOD.find(step => step.phase === day.phase)?.line}</T><T variant="meta">{program.sessions.filter(session => session.dayId === day.id).length} sessions in the current program</T><T variant="small">{program.forum.pillars.map(pillar => `${pillar.name} · ${pillar.island}`).join("\n")}</T><Link href={{ pathname: "/agenda", params: { day: day.id } }} asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Explore this day's sessions</T></Pressable></Link></View>)}
    <View style={styles.card}><T variant="title">The setting is part of the experience</T><T variant="small">Resorts, beaches, and island hospitality venues bring the conversations to life. Match your sessions to your ticket's transport and leave time for connections, meals, and island discovery. Five stops in one day depend on a confirmed operator itinerary.</T><Link href="/stays" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Explore accommodation options</T></Pressable></Link><Link href="/routes" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Plan island connections</T></Pressable></Link><Link href="/work" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Carry the work forward</T></Pressable></Link></View>
  </Screen>;
}
const styles = StyleSheet.create({ card: { margin: 16, padding: 18, gap: 12, borderRadius: 18, ...nightGlass }, link: { minHeight: 48, justifyContent: "center" } });
