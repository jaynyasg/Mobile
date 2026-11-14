import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { boatPreferenceLabel, type BoatPreference } from "@/logic/vipGroup";
import { colors, fonts } from "@/theme";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

const choices: { value: BoatPreference; label: string }[] = [
  { value: "full_boat", label: "I have a full boat (my own group of 8)" },
  { value: "shared", label: "I'm open to sharing a boat with other guests" },
];

export function VipStartSheet({
  email,
  name,
  phone,
  userId,
  onClose,
}: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  userId?: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<BoatPreference | null>(null);
  const [hostName, setHostName] = useState(name?.trim() ?? "");
  const [hostEmail, setHostEmail] = useState(email?.trim() ?? "");
  const [hostPhone, setHostPhone] = useState(phone?.trim() ?? "");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!choice || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/vip-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatPreference: choice,
          hostName,
          hostEmail,
          hostPhone,
          hostUserId: userId,
        }),
      });
      if (response.status === 503 || response.status === 502) {
        setMessage("Group booking isn't available yet.");
        return;
      }
      if (!response.ok) {
        setMessage("Choose a boat, then try again.");
        return;
      }
      const body = await response.json() as { url?: string };
      if (!body.url) {
        setMessage("Group booking isn't available yet.");
        return;
      }
      setLink(body.url);
    } catch {
      setMessage("Group booking isn't available yet.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (!link || typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title: "TATEL VIP", url: link });
    } catch {
      // The guest can still copy the link.
    }
  }

  const sheet = (
    <View
      style={[styles.overlay, { paddingTop: Math.max(12, insets.top + 8), paddingBottom: Math.max(12, insets.bottom + 8) }]}
      accessibilityViewIsModal
      accessibilityLabel="Start a VIP booking"
    >
      <View style={styles.card}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <T variant="eyebrow" color={colors.gold}>STAY onboard</T>
          <T variant="title" color={colors.foam}>All-inclusive VIP</T>
          {link ? (
            <>
              <T variant="small" color={colors.foam}>Share this link. Anyone with it can pay for one or more of the 8 shares.</T>
              <T variant="meta" color={colors.gold}>{link}</T>
              {choice ? <T variant="meta" color={colors.foam}>{boatPreferenceLabel(choice)}</T> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Copy booking link" onPress={() => void copy()} style={styles.gold}>
                <T variant="button" color={colors.ink}>{copied ? "Copied" : "Copy link"}</T>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Share booking link" onPress={() => void share()} style={styles.quiet}>
                <T variant="button" color={colors.gold}>Share</T>
              </Pressable>
            </>
          ) : (
            <>
              <T variant="small" color={colors.foam}>Before any payment, how is this boat filled?</T>
              {choices.map((option) => {
                const selected = choice === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option.label}
                    onPress={() => setChoice(option.value)}
                    style={[styles.option, selected && styles.optionOn]}
                  >
                    <View style={[styles.box, selected && styles.boxOn]}>
                      {selected ? <T variant="meta" color={colors.ink}>✓</T> : null}
                    </View>
                    <T variant="small" color={colors.foam} style={styles.optionText}>{option.label}</T>
                  </Pressable>
                );
              })}
              <Field label="Your name" value={hostName} onChangeText={setHostName} />
              <Field label="Email" value={hostEmail} onChangeText={setHostEmail} />
              <Field label="Phone" value={hostPhone} onChangeText={setHostPhone} />
              {message ? <T variant="meta" color={colors.gold}>{message}</T> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !choice || busy }}
                accessibilityLabel="Start the booking"
                disabled={!choice || busy}
                onPress={() => void start()}
                style={[styles.gold, (!choice || busy) && styles.off]}
              >
                <T variant="button" color={colors.ink}>{busy ? "Starting" : "Start the booking"}</T>
              </Pressable>
            </>
          )}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Close booking" onPress={onClose} style={styles.close}>
          <T variant="button" color={colors.gold}>Close</T>
        </Pressable>
      </View>
    </View>
  );
  return sheet;
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <T variant="meta" color={colors.foam}>{label}</T>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        autoCapitalize={label === "Email" ? "none" : "words"}
        keyboardType={label === "Email" ? "email-address" : label === "Phone" ? "phone-pad" : "default"}
        placeholderTextColor="rgba(245,241,232,0.62)"
        style={styles.input}
      />
    </View>
  );
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: {
    ...fixed,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 125,
    backgroundColor: "#071421",
    paddingLeft: 16,
    paddingRight: 16,
  },
  card: { flex: 1, minHeight: 0, padding: 16, gap: 8, borderRadius: 22, ...nightGlass, backgroundColor: "rgba(7,27,42,0.92)" },
  scroll: { flex: 1, minHeight: 0 },
  content: { gap: 12, paddingBottom: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,224,138,0.28)", backgroundColor: "rgba(7,27,42,0.55)" },
  optionOn: { borderColor: colors.gold },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.gold },
  optionText: { flex: 1 },
  field: { gap: 4 },
  input: { borderWidth: 1, borderColor: "rgba(255,224,138,0.42)", backgroundColor: "rgba(7,27,42,0.62)", color: colors.foam, fontFamily: fonts.body, fontSize: 16, padding: 12, borderRadius: 12 },
  gold: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, paddingHorizontal: 18 },
  quiet: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.45 },
  close: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
