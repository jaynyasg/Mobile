import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image, Pressable, StyleSheet, View, ViewStyle } from "react-native";
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

  const sheet = (
    <View style={styles.overlay}>
      <Image
        source={step === 0 ? beaconPoster : { uri: sceneForIsland(forum.pillars[0]?.island) }}
        style={styles.photo}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.shade} />
      <View style={[styles.copy, { paddingBottom: Math.max(insets.bottom, 24) + 16, paddingTop: insets.top + 24 }]}>
        {step === 0 ? (
          <>
            <T variant="eyebrow" color={colors.gold}>{visitorEdition(forum.edition)}</T>
            <T variant="title" color={colors.foam}>{forum.kicker}</T>
            <T variant="small" color={colors.foam}>{forum.dateLabel}</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Continue" onPress={() => setStep(1)} style={styles.pill}>
              <T variant="button" color={colors.ink}>Continue</T>
            </Pressable>
          </>
        ) : (
          <>
            <T variant="eyebrow" color={colors.gold}>Your tracks</T>
            <T variant="title" color={colors.foam}>What do you want to explore?</T>
            <T variant="small" color={colors.foam}>Pick one or more. You can change this later.</T>
            <View style={styles.tracks}>
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
                    <Image source={{ uri: sceneForIsland(pillar.island) }} style={styles.trackPhoto} resizeMode="cover" accessibilityIgnoresInvertColors />
                    <View style={styles.trackShade} />
                    <T variant="meta" color={colors.foam} numberOfLines={1}>{pillar.island}</T>
                    <T variant="small" color={colors.gold} numberOfLines={1}>{pillar.name}</T>
                  </Pressable>
                );
              })}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Continue" onPress={finish} style={styles.pill}>
              <T variant="button" color={colors.ink}>Continue</T>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

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
  tracks: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  track: { width: "47%", height: 92, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", padding: 8, borderWidth: 1, borderColor: "transparent" },
  trackOn: { borderColor: colors.gold },
  trackPhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  trackShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.35)" },
});
