import { useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import { credits, sessionById } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { Chip } from "@/components/ui";
import { routeMaps } from "@/images";
import { colors, pad } from "@/theme";

export default function TransportScreen() {
  const { program } = useContent();
  const { forum, transport } = program;
  const [modeId, setModeId] = useState(transport.modes[0].id);
  const [date, setDate] = useState(transport.modes[0].days[0].date);
  const mode = transport.modes.find((item) => item.id === modeId) ?? transport.modes[0];
  const day = mode.days.find((item) => item.date === date) ?? mode.days[0];

  return (
    <Screen edge="none">
      <StackHeader title="Sample transport" />
      <View style={styles.pad}>
        <T variant="eyebrow">Unconfirmed</T>
        <T variant="title">Routes</T>
        <T variant="small">{transport.intro}</T>
        <T variant="meta">Checked {transport.checked}. {transport.venueAssumptions}</T>
        <T variant="meta">{transport.borderNote}</T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {transport.modes.map((item) => (
          <Chip key={item.id} label={item.name} selected={item.id === mode.id} onPress={() => setModeId(item.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {forum.days.map((item) => (
          <Chip key={item.id} label={`${item.shortWeekday} ${item.dayNumber}`} selected={item.id === day.date} onPress={() => setDate(item.id)} />
        ))}
      </ScrollView>
      <View style={styles.pad}>
        <T variant="headline">{mode.name}</T>
        <T variant="meta">{mode.summary}</T>
        <T variant="small">{mode.description}</T>
        <T variant="small">{mode.warning}</T>
        <T variant="meta">{day.start}</T>
        <T variant="meta">Overnight: {day.overnight}</T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.mapScroll}>
        <Image source={routeMaps[day.map]} style={styles.map} resizeMode="contain" accessibilityLabel={day.mapDescription} />
      </ScrollView>
      <View style={styles.pad}>
        <T variant="meta">{day.mapDescription}</T>
        <T variant="meta">{credits.sentinelNote}</T>
        <T variant="meta">{credits.sentinel}</T>
        <T variant="meta">{credits.sentinelLicense}</T>
        <T variant="meta">{credits.coastline}</T>
      </View>
      {day.items.map((item, index) => {
        if (item.kind === "session") {
          const session = sessionById(item.sessionId);
          if (!session) return null;
          return (
            <Link key={item.sessionId} href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.stop}>
                <T variant="eyebrow">Featured stop · Proposed</T>
                <T variant="rowTitle">{session.title}</T>
                <T variant="meta">
                  {session.island} · speakers and venue unconfirmed
                </T>
              </Pressable>
            </Link>
          );
        }
        return (
          <View key={`${item.title}-${index}`} style={styles.leg}>
            <T variant="eyebrow">{item.caution ? "Tight connection" : "Transfer estimate"}</T>
            <T variant="rowTitle">{item.title}</T>
            <T variant="meta">{item.time}</T>
            <T variant="small">{item.detail}</T>
          </View>
        );
      })}
      <View style={styles.pad}>
        <T variant="eyebrow">Source schedules</T>
        {transport.sources.map((source) => (
          <T key={source.url} variant="meta">
            {source.title}
          </T>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: pad, gap: 8, paddingBottom: 8 },
  chips: { paddingHorizontal: pad, gap: 8, paddingBottom: 8 },
  mapScroll: { paddingHorizontal: pad },
  map: { width: 720, height: 420, backgroundColor: colors.ink },
  stop: { marginHorizontal: pad, marginBottom: 8, padding: 12, gap: 3, borderWidth: 1, borderColor: colors.brassSoft, backgroundColor: "#F8F1D8" },
  leg: { marginHorizontal: pad, marginBottom: 8, padding: 12, gap: 3, borderWidth: 1, borderColor: colors.line },
});
