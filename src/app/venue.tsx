import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { forum, roomById } from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { PrimaryButton, SectionLabel } from "@/components/ui";
import { colors, pad } from "@/theme";

const plan = [
  ["lobby", "courtyard"],
  ["main-hall"],
  ["reading-room", "map-room"],
];

export default function VenueScreen() {
  const params = useLocalSearchParams<{ room?: string }>();
  const initial = typeof params.room === "string" && roomById(params.room) ? params.room : "main-hall";
  const [selectedId, setSelectedId] = useState(initial);
  const selected = roomById(selectedId);
  const { venue } = forum;

  function openMaps() {
    const query = encodeURIComponent(venue.name);
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${venue.latitude},${venue.longitude}&q=${query}`
        : Platform.OS === "android"
          ? `geo:${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}(${query})`
          : `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
    Linking.openURL(url).catch(() => undefined);
  }

  return (
    <Screen edge="none">
      <StackHeader title="Harbor Hall" />
      <View style={styles.body}>
        <T variant="title">{venue.name}</T>
        <T variant="small">
          {venue.addressLine}
          {"\n"}
          {venue.locality}
        </T>
        <T variant="body">{venue.summary}</T>
        <PrimaryButton label="Open the sample pin" onPress={openMaps} />
        <T variant="meta">{venue.pinNote}</T>
      </View>
      <SectionLabel>Floor 1</SectionLabel>
      <View style={styles.plan}>
        {plan.map((row) => (
          <View key={row.join("-")} style={styles.planRow}>
            {row.map((id) => (
              <RoomTile key={id} id={id} selected={selectedId === id} tall={id === "main-hall"} onPress={() => setSelectedId(id)} />
            ))}
          </View>
        ))}
        <T variant="eyebrow" style={styles.floor}>
          Floor 2
        </T>
        <View style={styles.planRow}>
          <RoomTile id="arcade" selected={selectedId === "arcade"} onPress={() => setSelectedId("arcade")} />
          <RoomTile id="cloister" selected={selectedId === "cloister"} onPress={() => setSelectedId("cloister")} />
        </View>
      </View>
      {selected ? (
        <View style={styles.detail}>
          <T variant="eyebrow">{selected.floor}</T>
          <T variant="headline">{selected.name}</T>
          <T variant="body">{selected.summary}</T>
        </View>
      ) : null}
      <SectionLabel>In the room</SectionLabel>
      {forum.conduct.map((rule) => (
        <T key={rule} variant="small" style={styles.rule}>
          {rule}
        </T>
      ))}
    </Screen>
  );
}

function RoomTile({
  id,
  selected,
  tall,
  onPress,
}: {
  id: string;
  selected: boolean;
  tall?: boolean;
  onPress: () => void;
}) {
  const room = roomById(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tile, tall && styles.tall, selected && styles.tileOn]}
    >
      <T variant="rowTitle" color={selected ? colors.ivory : colors.ink}>
        {room?.name}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: pad, gap: 10 },
  plan: { paddingHorizontal: pad, gap: 8 },
  planRow: { flexDirection: "row", gap: 8 },
  floor: { marginTop: 8 },
  tile: {
    flex: 1,
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    padding: 12,
    justifyContent: "flex-end",
  },
  tall: { minHeight: 96 },
  tileOn: { backgroundColor: colors.pine, borderColor: colors.pine },
  detail: { paddingHorizontal: pad, paddingTop: 16, gap: 6 },
  rule: { paddingHorizontal: pad, paddingBottom: 8 },
});
