import { useState } from "react";
import { createPortal } from "react-dom";
import { Image, Pressable, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reels } from "@/content/reels";
import { useContent } from "@/content/provider";
import type { PassAnswer, StayAnswer } from "@/logic/pathPlan";
import { colors } from "@/theme";
import { T } from "./Text";

const passOptions: { id: PassAnswer; label: string }[] = [
  { id: "have", label: "Yes, I have it" },
  { id: "not-yet", label: "Not yet" },
  { id: "unsure", label: "Not sure" },
];

const stayOptions: { id: StayAnswer; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "booked", label: "Already booked" },
  { id: "browsing", label: "Just browsing" },
];

export function Questions({
  onDone,
  onSkip,
}: {
  onDone: (answers: { hasPass: PassAnswer; areas: string[]; needsStay: StayAnswer }) => void;
  onSkip: (answers: { hasPass: PassAnswer; areas: string[]; needsStay: StayAnswer }) => void;
}) {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const [step, setStep] = useState(0);
  const [hasPass, setHasPass] = useState<PassAnswer | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [needsStay, setNeedsStay] = useState<StayAnswer | null>(null);

  function finish(next: { hasPass: PassAnswer; areas: string[]; needsStay: StayAnswer }) {
    onDone(next);
  }

  function skip() {
    onSkip({ hasPass: hasPass ?? "unsure", areas, needsStay: needsStay ?? "browsing" });
  }

  const photo = step === 0 ? "/reels/pass.jpg" : step === 2 ? "/reels/stays.jpg" : "/reels/venues.jpg";
  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.shade} />
      <View style={[styles.frame, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={step === 0} onPress={() => setStep((current) => Math.max(0, current - 1))} style={styles.ghost}>
            <T variant="button" color={step === 0 ? "rgba(245,241,232,0.35)" : colors.foam}>Back</T>
          </Pressable>
          <T variant="meta" color={colors.gold}>{step + 1} of 3</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={skip} style={styles.ghost}>
            <T variant="button" color={colors.gold}>Skip</T>
          </Pressable>
        </View>
        {step === 0 ? (
          <View style={styles.body}>
            <T variant="title" color={colors.foam}>Do you already have your pass?</T>
            {passOptions.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                onPress={() => {
                  setHasPass(option.id);
                  setStep(1);
                }}
                style={styles.tile}
              >
                <T variant="rowTitle" color={colors.foam}>{option.label}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
        {step === 1 ? (
          <View style={[styles.body, styles.bodyTop]}>
            <T variant="title" color={colors.foam}>Which infrastructure areas are you thinking of attending?</T>
            <ScrollView style={styles.areaScroll} contentContainerStyle={styles.areaList}>
              {program.forum.pillars.map((pillar) => {
                const on = areas.includes(pillar.id);
                const poster = (reels as Record<string, { poster?: string }>)[pillar.id]?.poster ?? "/reels/venues.jpg";
                return (
                  <Pressable
                    key={pillar.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${pillar.name}, ${pillar.island}`}
                    onPress={() => setAreas((current) => (current.includes(pillar.id) ? current.filter((id) => id !== pillar.id) : [...current, pillar.id]))}
                    style={[styles.area, on && styles.areaOn]}
                  >
                    <Image source={{ uri: poster }} style={styles.areaPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                    <View style={styles.areaShade} />
                    <View style={styles.areaCopy}>
                      <T variant="rowTitle" color={colors.foam}>{pillar.name}</T>
                      <T variant="meta" color={colors.gold}>{pillar.island}</T>
                    </View>
                    {on ? <View style={styles.check}><T variant="button" color={colors.ink}>✓</T></View> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              onPress={() => setStep(2)}
              style={styles.next}
            >
              <T variant="button" color={colors.ink}>Next</T>
            </Pressable>
          </View>
        ) : null}
        {step === 2 ? (
          <View style={styles.body}>
            <T variant="title" color={colors.foam}>Are you looking for a place to stay?</T>
            {stayOptions.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                onPress={() => {
                  setNeedsStay(option.id);
                  finish({ hasPass: hasPass ?? "unsure", areas, needsStay: option.id });
                }}
                style={styles.tile}
              >
                <T variant="rowTitle" color={colors.foam}>{option.label}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 95, backgroundColor: "#071421" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.94) 0%, rgba(6,14,24,0.72) 46%, rgba(6,14,24,0.45) 100%)" } as ViewStyle),
  },
  frame: { flex: 1, paddingHorizontal: 16, gap: 12 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ghost: { minHeight: 44, minWidth: 64, justifyContent: "center" },
  body: { flex: 1, justifyContent: "flex-end", gap: 10, paddingBottom: 8 },
  bodyTop: { justifyContent: "flex-start" },
  areaScroll: { flex: 1 },
  tile: {
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 18,
    justifyContent: "center",
    backgroundColor: "rgba(7,27,42,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.55)",
  },
  areaList: { gap: 8, paddingBottom: 8 },
  area: { height: 84, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: 2, borderColor: "transparent" },
  areaOn: { borderColor: colors.gold },
  areaPhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  areaShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.88), rgba(6,14,24,0.35))" } as ViewStyle),
  },
  areaCopy: { zIndex: 1, paddingHorizontal: 14, paddingBottom: 10, gap: 2 },
  check: { position: "absolute", top: 10, right: 10, zIndex: 2, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  next: { minHeight: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
