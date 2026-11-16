import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { openExternal } from "@/navigation/pwaNav";
import { colors } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

/** A real outside page. Opens in a new tab so the installed app stays open. */
export function ExternalLink({
  href,
  label,
  children,
  style,
}: {
  href: string;
  label: string;
  children?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}, opens in a new tab`}
      onPress={() => openExternal(href)}
      style={[styles.hit, style]}
    >
      <T variant="button" color={colors.ink} numberOfLines={2}>{children ?? label}</T>
      <Icon name="external" size={16} color={colors.ink} />
    </Pressable>
  );
}

export function ExternalText({ href, label }: { href: string; label: string }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${label}, opens in a new tab`} onPress={() => openExternal(href)} style={styles.text}>
      <T variant="meta" color={colors.gold}>{label}</T>
      <Icon name="external" size={14} color={colors.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: "flex-start",
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.gold,
  },
  text: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 4 },
});

export function ExternalRow({ children }: { children: ReactNode }) {
  return <View style={{ gap: 6 }}>{children}</View>;
}
