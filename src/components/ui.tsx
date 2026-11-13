import { Href, Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, fonts, pad } from "@/theme";
import { CrystalMark } from "./CrystalMark";
import { Glass } from "./Glass";
import { shimmerStyle } from "./gloss";
import { Icon } from "./Icon";
import { T } from "./Text";

export function PageHeader({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <Glass tone="dark" style={styles.header}>
      {kicker === "TATEL" ? <CrystalMark size="mark" /> : kicker ? <T variant="eyebrow" color={colors.gold}>{kicker}</T> : null}
      <T variant="title" foil>{title}</T>
      {subtitle ? <T variant="meta" color={colors.onDarkSoft} style={styles.subtitle}>{subtitle}</T> : null}
    </Glass>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <Glass tone="dark" style={styles.section}>
      <T variant="eyebrow" color={colors.gold}>{children}</T>
    </Glass>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, shimmerStyle(), disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <T variant="button" color={colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
    >
      <T variant="button" color={colors.foam}>{label}</T>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  swatch,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  swatch?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      {swatch ? <View style={[styles.swatch, { backgroundColor: selected ? colors.ivory : swatch }]} /> : null}
      <T variant="small" color={colors.foam} style={styles.chipLabel}>
        {label}
      </T>
    </Pressable>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <T variant="headline" style={styles.emptyTitle}>
        {title}
      </T>
      <T variant="meta">{body}</T>
    </View>
  );
}

export function LinkRow({
  href,
  label,
  detail,
  badge,
}: {
  href: Href;
  label: string;
  detail?: string;
  badge?: number;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.linkRow}>
          <View style={styles.linkCopy}>
            <T variant="rowTitle">{label}</T>
            {detail ? <T variant="meta">{detail}</T> : null}
          </View>
          {badge ? (
            <View style={styles.badge}>
              <T variant="meta" color={colors.ivory} style={styles.badgeText}>
                {badge}
              </T>
            </View>
          ) : null}
          <Icon name="chevron" size={18} color={colors.gold} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18, gap: 4 },
  subtitle: { marginTop: 8 },
  section: { alignSelf: "flex-start", marginLeft: pad, marginTop: 22, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  primary: {
    backgroundColor: colors.gold,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,248,220,0.8)",
    shadowColor: "#E7C56A",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  secondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.48)",
    backgroundColor: "rgba(7,27,42,0.58)",
    paddingHorizontal: 16,
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.72 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.42)",
    backgroundColor: "rgba(7,27,42,0.58)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  chipOn: { backgroundColor: "rgba(16,52,68,0.92)", borderColor: colors.gold },
  chipLabel: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 16 },
  swatch: { width: 8, height: 8, borderRadius: 4 },
  empty: { paddingHorizontal: pad, paddingVertical: 28, gap: 8 },
  emptyTitle: { fontSize: 26 },
  meterBlock: { gap: 8 },
  meterTrack: { height: 4, backgroundColor: colors.line, borderRadius: 2, overflow: "hidden" },
  meterFill: { height: 4, borderRadius: 2 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.48)",
    backgroundColor: "rgba(7,27,42,0.58)",
  },
  linkCopy: { flex: 1, gap: 2 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.clay,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 14 },
});
