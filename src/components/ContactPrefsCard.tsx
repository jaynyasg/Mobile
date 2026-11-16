import { useState } from "react";
import { createPortal } from "react-dom";
import { Image, Pressable, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ALERTS_DETAIL,
  ALERTS_LABEL,
  NEWS_DETAIL,
  NEWS_LABEL,
  type ContactPrefs,
} from "@/logic/contactPrefs";
import { colors } from "@/theme";
import { notchPadding } from "./notch";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

export function ContactToggles({
  prefs,
  onChange,
}: {
  prefs: ContactPrefs;
  onChange: (next: ContactPrefs) => void;
}) {
  return (
    <View style={styles.toggles}>
      <Toggle
        label={ALERTS_LABEL}
        detail={ALERTS_DETAIL}
        checked={prefs.alerts}
        onPress={() => onChange({ ...prefs, alerts: !prefs.alerts })}
      />
      <Toggle
        label={NEWS_LABEL}
        detail={NEWS_DETAIL}
        checked={prefs.marketing}
        onPress={() => onChange({ ...prefs, marketing: !prefs.marketing })}
      />
    </View>
  );
}

export function ContactPrefsCard({
  initial,
  onSave,
  onSkip,
}: {
  initial: ContactPrefs;
  onSave: (prefs: ContactPrefs) => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState(initial);
  const sheet = (
    <View style={[styles.overlay, notchPadding("top", 16, insets.top), notchPadding("bottom", 16, insets.bottom)]} accessibilityViewIsModal accessibilityLabel="Notification choices">
      <Image source={{ uri: "/reels/community.jpg" }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.shade} />
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <T variant="eyebrow" color={colors.gold}>Notifications</T>
        <T variant="title" color={colors.foam}>What should we keep for you?</T>
        <T variant="small" color={colors.foam}>Both are off until you turn them on. This only saves your choice.</T>
        <ContactToggles prefs={prefs} onChange={setPrefs} />
        <Pressable accessibilityRole="button" accessibilityLabel="Save" onPress={() => onSave(prefs)} style={styles.save}>
          <T variant="button" color={colors.ink}>Save</T>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} style={styles.skip}>
          <T variant="button" color={colors.gold}>Skip</T>
        </Pressable>
      </View>
      </ScrollView>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

function Toggle({
  label,
  detail,
  checked,
  onPress,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked }} accessibilityLabel={label} onPress={onPress} style={styles.toggle}>
      <View style={styles.toggleCopy}>
        <T variant="rowTitle" color={colors.foam}>{label}</T>
        <T variant="meta" color={colors.foam}>{detail}</T>
      </View>
      <View style={[styles.knob, checked && styles.knobOn]}>
        <View style={[styles.dot, checked && styles.dotOn]} />
      </View>
    </Pressable>
  );
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: "#071421" },
  sheet: { flex: 1, minHeight: 0 },
  sheetContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 16 },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.94), rgba(6,14,24,0.72))" } as ViewStyle),
  },
  card: { marginHorizontal: 16, padding: 18, gap: 12, borderRadius: 22, ...nightGlass, backgroundColor: "rgba(7,27,42,0.88)" },
  toggles: { gap: 10 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, padding: 12, borderRadius: 16, backgroundColor: "rgba(6,14,24,0.45)" },
  toggleCopy: { flex: 1, gap: 2 },
  knob: { width: 48, height: 28, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,224,138,0.55)", justifyContent: "center", paddingHorizontal: 3 },
  knobOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(245,241,232,0.7)" },
  dotOn: { alignSelf: "flex-end", backgroundColor: colors.ink },
  save: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  skip: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
