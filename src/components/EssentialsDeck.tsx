import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { essentials } from "@/guide/essentials";
import { addStamp, knowStamp, pulse, prefersReducedMotion } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

export function EssentialsDeck({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width, 440) - 48;
  const [moreId, setMoreId] = useState<string | null>(null);

  return (
    <View style={styles.overlay}>
      <View style={styles.bar}>
        <T variant="eyebrow" color={colors.gold}>Need to know</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
          <T variant="button" color={colors.foam}>Close</T>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} decelerationRate="fast">
        {essentials.map((item) => {
          const open = moreId === item.id;
          return (
            <View key={item.id} style={[styles.card, { width: cardWidth }, nightGlass]}>
              <T variant="title" color={colors.foam}>{item.title}</T>
              <T variant="small" color={colors.foam}>{item.line}</T>
              {item.check ? <T variant="meta" color={colors.gold}>Check before travel</T> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={open ? "Hide details" : "More"}
                onPress={() => {
                  if (!open && addStamp(localReelStore(), knowStamp(item.id))) pulse(prefersReducedMotion());
                  setMoreId(open ? null : item.id);
                }}
                style={styles.more}
              >
                <T variant="button" color={colors.ink}>{open ? "Hide" : "More"}</T>
              </Pressable>
              {open ? (
                <ScrollView style={styles.detail}>
                  <T variant="meta" color={colors.foam}>{item.more}</T>
                  {item.sources.map((source) => (
                    <T key={source.url} variant="meta" color={colors.gold}>{source.title}</T>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 40, justifyContent: "flex-end", backgroundColor: "rgba(6,14,24,0.45)", paddingBottom: 24 },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  close: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { height: 360, borderRadius: 22, padding: 18, gap: 10, justifyContent: "flex-end" },
  more: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  detail: { maxHeight: 140 },
});
