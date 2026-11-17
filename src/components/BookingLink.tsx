import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";
import { ProviderPreview } from "./ProviderPreview";
export function BookingLink({ href, name, label = "View & book", detail, onConfirmed }: { href: string; name: string; label?: string; detail?: string; onConfirmed?: () => void }) {
  const [open, setOpen] = useState(false);
  return <><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${name}`} onPress={() => setOpen(true)} style={styles.action}><T variant="button" color={colors.ink}>{label}</T></Pressable>
    {open ? <ProviderPreview href={href} name={name} detail={detail} onClose={() => setOpen(false)} onConfirmed={onConfirmed} /> : null}</>;
}
const styles = StyleSheet.create({ action: { alignSelf: "flex-start", minHeight: 48, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.gold } });
