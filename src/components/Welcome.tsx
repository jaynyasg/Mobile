import { useState } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { colors } from "@/theme";
import { Glass } from "./Glass";
import { T } from "./Text";

export function Welcome({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum } = program;
  const [step, setStep] = useState(0);
  const cards = [
    {
      title: forum.name,
      body: `${forum.kicker}. ${forum.dateLabel}. ${forum.placeLabel}.`,
    },
    {
      title: "Start here",
      body: "Program is the schedule. Venues are the places on each island.",
    },
    {
      title: "The practical pages",
      body: "Transport, Stays, and Pass are on this screen. Community is the live chat.",
    },
  ];
  const card = cards[step];
  const last = step === cards.length - 1;
  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="How TATEL works">
      <Pressable accessibilityRole="button" accessibilityLabel="Skip the introduction" style={styles.backdrop} onPress={onClose} />
      <Glass tone="dark" style={[styles.card, { marginBottom: Math.max(insets.bottom, 16), backgroundColor: "rgba(8,16,28,0.92)" }]}>
        <T variant="eyebrow" color={colors.gold}>{step + 1} of {cards.length}</T>
        <T variant="title" color={colors.ivory}>{card.title}</T>
        <T variant="body" color={colors.ivory}>{card.body}</T>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onClose} style={styles.skip}>
            <T variant="button" color={colors.ivory}>Skip</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={last ? "Start here" : "Next"}
            onPress={() => (last ? onClose() : setStep((current) => current + 1))}
            style={styles.next}
          >
            <T variant="button" color={colors.ink}>{last ? "Start here" : "Next"}</T>
          </Pressable>
        </View>
      </Glass>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 90, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.5)" },
  card: { marginHorizontal: 12, gap: 12, borderRadius: 22 },
  row: { flexDirection: "row", gap: 10, marginTop: 4 },
  skip: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: "rgba(247,244,239,0.45)" },
  next: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.gold },
});
