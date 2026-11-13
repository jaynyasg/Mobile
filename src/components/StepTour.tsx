import { createPortal } from "react-dom";
import { Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { T } from "./Text";

export function StepTour({
  top,
  left,
  width,
  height,
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
  caption: string;
  canBack: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const dockTop = screen - (112 + 12 + Math.max(insets.bottom, 6));
  const bubbleHeight = 132;
  const below = top + height + 12;
  const bubbleTop = below + bubbleHeight < dockTop ? below : Math.max(insets.top + 8, top - bubbleHeight - 12);

  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal>
      <View style={[styles.dim, { top: 0, left: 0, right: 0, height: top }]} />
      <View style={[styles.dim, { top, left: 0, width: left, height }]} />
      <View style={[styles.dim, { top, left: left + width, right: 0, height }]} />
      <View style={[styles.dim, { top: top + height, left: 0, right: 0, bottom: 0 }]} />
      <View pointerEvents="none" style={[styles.ring, { top, left, width, height }]} />
      <View style={[styles.bubble, { top: bubbleTop }]}>
        <T variant="small" color={colors.foam}>{caption}</T>
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

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 80 },
  dim: { position: "absolute", backgroundColor: "rgba(6,14,24,0.72)" },
  ring: { position: "absolute", borderWidth: 2, borderColor: colors.gold, borderRadius: 22 },
  bubble: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(7,27,42,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.48)",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  ghost: { minHeight: 44, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  next: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
