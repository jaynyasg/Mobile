import { Href, Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { Icon, IconName } from "./Icon";
import { T } from "./Text";

export function ActionTile({
  href,
  icon,
  label,
  detail,
}: {
  href: Href;
  icon: IconName;
  label: string;
  detail: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
      >
        <View style={[styles.tile, hover && styles.hover]}>
          <View style={styles.icon}>
            <Icon name={icon} size={20} color={colors.ink} />
          </View>
          <View style={styles.copy}>
            <T variant="rowTitle">{label}</T>
            <T variant="meta" numberOfLines={2}>{detail}</T>
          </View>
          <Icon name="chevron" size={18} color={colors.ink} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: 56 },
  tile: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(11,27,43,0.16)",
    backgroundColor: "#F7F4EF",
    shadowColor: "#071421",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  hover: { borderColor: colors.gold, backgroundColor: "#FFF9EC" },
  pressed: { opacity: 0.78 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,224,138,0.55)",
  },
  copy: { flex: 1, gap: 2 },
});
