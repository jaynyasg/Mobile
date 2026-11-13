import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image, Pressable, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { webTrackStore, writeTracks } from "@/guide/interests";
import { beaconPoster } from "@/images";
import { visitorEdition } from "@/content/labels";
import { colors, sceneForIsland } from "@/theme";
import { T } from "./Text";

export function Welcome({ onClose, start = "arrival" }: { onClose: () => void; start?: "arrival" | "tracks" }) {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum } = program;
  const [step, setStep] = useState(start === "tracks" ? 1 : 0);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function finish() {
    const ids = picked.length ? picked : forum.pillars.map((pillar) => pillar.id);
    const store = webTrackStore();
    writeTracks(store, ids);
    onClose();
  }

  const arrival = (
    <View style={styles.overlay}>
      <Image source={beaconPoster} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.shade} />
      <View style={[styles.copy, { paddingBottom: Math.max(insets.bottom, 24) + 16, paddingTop: insets.top + 24 }]}>
        <T variant="eyebrow" color={colors.gold}>{visitorEdition(forum.edition)}</T>
        <T variant="title" color={colors.foam}>{forum.kicker}</T>
        <T variant="small" color={colors.foam}>{forum.dateLabel}</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Continue" onPress={() => setStep(1)} style={styles.pill}>
          <T variant="button" color={colors.ink}>Continue</T>
        </Pressable>
      </View>
    </View>
  );

  const tracks = (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={[styles.trackScroll, { paddingTop: insets.top + 20 }]}>
        <T variant="eyebrow" color={colors.gold}>Your tracks</T>
        <T variant="title" color={colors.foam} style={styles.ask}>What do you want to explore?</T>
        <T variant="small" color={colors.foam}>Pick one or more. You can change this later.</T>
        {forum.pillars.map((pillar) => {
          const on = picked.includes(pillar.id);
          return (
            <Pressable
              key={pillar.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${pillar.name}, ${pillar.island}`}
              onPress={() => setPicked((current) => (current.includes(pillar.id) ? current.filter((id) => id !== pillar.id) : [...current, pillar.id]))}
              style={[styles.track, on && styles.trackOn]}
            >
              <Image source={{ uri: sceneForIsland(pillar.island) }} style={[styles.trackPhoto, pillar.island === "Scrub Island" && styles.trackPhotoCenter]} resizeMode="cover" accessibilityIgnoresInvertColors />
              <View style={styles.trackShade} />
              <View style={styles.trackCopy}>
                <T variant="meta" color={colors.gold}>{pillar.island}</T>
                <T variant="rowTitle" color={colors.foam}>{pillar.name}</T>
              </View>
              {on ? (
                <View style={styles.check}>
                  <T variant="button" color={colors.ink}>✓</T>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Continue" onPress={finish} style={styles.continue}>
          <T variant="button" color={colors.ink}>Continue</T>
        </Pressable>
      </View>
    </View>
  );

  const sheet = step === 0 ? arrival : tracks;

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 90, backgroundColor: "#071421" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.92) 0%, rgba(6,14,24,0.55) 42%, rgba(6,14,24,0.28) 100%)" } as ViewStyle),
  },
  copy: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, gap: 10 },
  pill: {
    alignSelf: "flex-start",
    minHeight: 48,
    marginTop: 8,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  ask: { letterSpacing: 0, fontSize: 34, lineHeight: 40 },
  trackScroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  track: { height: 92, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", padding: 14, borderWidth: 2, borderColor: "transparent" },
  trackOn: { borderColor: colors.gold },
  trackPhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  trackPhotoCenter: { width: "240%", left: "-70%", right: "auto" },
  trackShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.92) 0%, rgba(6,14,24,0.72) 55%, rgba(6,14,24,0.45) 100%)" } as ViewStyle),
  },
  trackCopy: { zIndex: 1, gap: 2 },
  check: { position: "absolute", top: 12, right: 12, zIndex: 2, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#071421" },
  continue: { minHeight: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
