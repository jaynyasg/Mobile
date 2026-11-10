import { Href, Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function PersonRow({
  name,
  meta,
  href,
  photo,
}: {
  name: string;
  meta: string;
  href: Href;
  photo?: ImageSourcePropType;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {photo ? <Image source={photo} style={styles.photo} resizeMode="contain" accessibilityIgnoresInvertColors /> : null}
        <View style={styles.copy}>
          <T variant="rowTitle" color={colors.onDark}>{name}</T>
          <T variant="meta" color={colors.onDarkSoft}>{meta}</T>
        </View>
        <Icon name="chevron" size={18} color={colors.onDarkSoft} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(247,244,239,0.28)",
  },
  photo: { width: 52, height: 64, backgroundColor: colors.muted },
  copy: { flex: 1, gap: 2 },
  pressed: { opacity: 0.72 },
});
