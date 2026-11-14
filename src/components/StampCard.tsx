import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import type { Pillar } from "@/content/types";
import { zoneReelIds } from "@/content/reels";
import { islandStamp, prefersReducedMotion, readStamps } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { colors } from "@/theme";

const ways = ["Open an area", "Open a session", "Finish a step on For you"];

export function StampCard({ pillars, onOpen }: { pillars: readonly Pillar[]; onOpen: (id: string) => void }) {
  const [tick, setTick] = useState(0);
  const reduced = prefersReducedMotion();
  useFocusEffect(useCallback(() => {
    setTick((value) => value + 1);
  }, []));
  const stamps = new Set(readStamps(localReelStore()));
  void tick;
  const held = pillars.filter((pillar) => stamps.has(islandStamp(pillar.id))).length;

  return (
    <View style={styles.book}>
      <T variant="eyebrow" color={colors.gold}>Stamp card</T>
      <T variant="small" color={colors.foam}>Stamp the infrastructures you care about. The team sees which areas people want, and each one meets on an island.</T>
      <T variant="title" color={colors.foam}>{held} of {pillars.length} areas</T>
      <T variant="eyebrow" color={colors.gold}>How a stamp lands</T>
      {ways.map((way) => (
        <T key={way} variant="small" color={colors.foam}>{way}</T>
      ))}
      <View style={styles.stamps}>
        {pillars.map((pillar) => {
          const heldStamp = stamps.has(islandStamp(pillar.id));
          const canOpen = (zoneReelIds as readonly string[]).includes(pillar.id);
          return (
            <Pressable
              key={pillar.id}
              accessibilityRole="button"
              accessibilityLabel={heldStamp ? `${pillar.name} stamped, ${pillar.island}` : `Open ${pillar.name} on ${pillar.island}`}
              onPress={() => {
                if (canOpen) onOpen(pillar.id);
              }}
              style={styles.slot}
            >
              <View style={[styles.stamp, heldStamp && styles.stampOn, heldStamp && !reduced && styles.stampIn]}>
                <T variant="meta" color={heldStamp ? colors.ink : colors.gold}>{heldStamp ? "✓" : ""}</T>
              </View>
              <T variant="small" color={colors.foam} numberOfLines={2} style={styles.name}>{pillar.name}</T>
              <T variant="meta" color={colors.gold} numberOfLines={2} style={styles.place}>{pillar.island}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  book: { marginHorizontal: 16, marginBottom: 16, padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  stamps: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  slot: { width: "47%", minHeight: 118, alignItems: "center", gap: 4, paddingVertical: 6 },
  stamp: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255,224,138,0.7)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,27,42,0.28)",
  },
  stampOn: { backgroundColor: colors.gold, borderStyle: "solid", borderColor: colors.gold },
  stampIn: {
    ...({
      animationDuration: "420ms",
      animationTimingFunction: "ease",
      animationKeyframes: {
        from: { transform: "scale(0.82)" },
        to: { transform: "scale(1)" },
      },
    } as object),
  },
  name: { textAlign: "center" },
  place: { textAlign: "center", fontSize: 13, lineHeight: 16 },
});
