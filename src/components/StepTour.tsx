import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captionTop, TOUR_BUBBLE } from "@/guide/path";
import { prefersReducedMotion } from "@/guide/stamps";
import { colors, fonts } from "@/theme";
import { dockClearance } from "./Dock";
import { T } from "./Text";

export function StepTour({
  top,
  left,
  width,
  height,
  step,
  total,
  title,
  caption,
  canBack,
  onBack,
  onNext,
  onSkip,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
  step: number;
  total: number;
  title: string;
  caption: string;
  canBack: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const [reduce, setReduce] = useState(true);
  useEffect(() => setReduce(prefersReducedMotion()), []);
  const dockTop = screen - dockClearance(insets.bottom);
  const bubbleTop = captionTop(top, height, dockTop, Math.max(8, insets.top), TOUR_BUBBLE);

  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal>
      <View style={[styles.dim, { top: 0, left: 0, right: 0, height: top }]} />
      <View style={[styles.dim, { top, left: 0, width: left, height }]} />
      <View style={[styles.dim, { top, left: left + width, right: 0, height }]} />
      <View style={[styles.dim, { top: top + height, left: 0, right: 0, bottom: 0 }]} />
      <View pointerEvents="none" style={[styles.ring, { top, left, width, height }]} />
      <View style={[styles.bubble, { top: bubbleTop }]} accessibilityLabel={caption}>
        <View key={step} style={[styles.hero, !reduce && styles.pop]}>
          <T style={styles.numeral} accessibilityElementsHidden>{step + 1}</T>
          <T style={styles.of} accessibilityElementsHidden>/ {total}</T>
        </View>
        <T variant="small" color={colors.foam} style={styles.title} numberOfLines={2}>{title}</T>
        <View style={styles.bar}>
          {Array.from({ length: total }, (_, index) => (
            <View key={index} style={[styles.seg, index <= step ? styles.segOn : styles.segOff]} />
          ))}
        </View>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={!canBack} onPress={onBack} style={styles.ghost}>
            <T variant="button" color={canBack ? colors.foam : "rgba(245,241,232,0.35)"}>Back</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip tutorial" onPress={onSkip} style={styles.ghost}>
            <T variant="button" color={colors.gold}>Skip tutorial</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next" onPress={onNext} style={styles.next}>
            <T variant="button" color={colors.ink}>Next</T>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

const fixed = { position: "fixed" } as unknown as ViewStyle;
const pop = { animation: "tatel-step-pop 280ms ease-out" } as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 80 },
  dim: { position: "absolute", backgroundColor: "rgba(6,14,24,0.72)" },
  ring: { position: "absolute", borderWidth: 2, borderColor: colors.gold, borderRadius: 22 },
  bubble: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: 18,
    backgroundColor: "rgba(7,27,42,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.48)",
  },
  hero: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  pop,
  numeral: { fontFamily: fonts.semibold, fontSize: 48, lineHeight: 52, color: colors.gold },
  of: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, marginBottom: 6, color: colors.gold },
  title: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  bar: { flexDirection: "row", gap: 5, height: 8 },
  seg: { flex: 1, borderRadius: 99 },
  segOn: { backgroundColor: colors.gold },
  segOff: { backgroundColor: "rgba(255,224,138,0.28)" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  ghost: { minHeight: 44, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  next: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});

if (typeof document !== "undefined" && !document.getElementById("tatel-step-pop")) {
  const style = document.createElement("style");
  style.id = "tatel-step-pop";
  style.textContent = "@keyframes tatel-step-pop { from { transform: scale(0.82); } to { transform: scale(1); } } @media (prefers-reduced-motion: reduce) { [style*='tatel-step-pop'] { animation: none !important; } }";
  document.head.appendChild(style);
}
