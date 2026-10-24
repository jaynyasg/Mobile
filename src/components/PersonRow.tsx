import { Href, Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, pad } from "@/theme";
import { Icon } from "./Icon";
import { Monogram } from "./Monogram";
import { T } from "./Text";

export function PersonRow({
  name,
  meta,
  href,
}: {
  name: string;
  meta: string;
  href: Href;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Monogram name={name} />
        <View style={styles.copy}>
          <T variant="rowTitle">{name}</T>
          <T variant="meta">{meta}</T>
        </View>
        <Icon name="chevron" size={18} color={colors.inkSoft} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: pad,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  copy: { flex: 1, gap: 2 },
  pressed: { opacity: 0.72 },
});
