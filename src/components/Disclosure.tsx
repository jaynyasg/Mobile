import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";

/** Keep the invitation short, with the full explanation a tap away. */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: open ? 8 : 0 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} aria-expanded={open} onPress={() => setOpen(!open)} style={{ minHeight: 44, justifyContent: "center", paddingVertical: 8 }}>
      <T variant="button" color={colors.gold}>{label} {open ? "−" : "+"}</T>
    </Pressable>
    {open ? <View style={{ gap: 12 }}>{children}</View> : null}
  </View>;
}
