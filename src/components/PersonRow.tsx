import { Href, Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "@/theme";
import { Icon } from "./Icon";
import { Portrait } from "./Portrait";
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
    <View style={styles.row}>
      <Portrait name={name} source={photo} size={64} />
      <Link href={href} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
          <View style={styles.copy}>
            <T variant="rowTitle" numberOfLines={1}>{name}</T>
            <T variant="meta" numberOfLines={2}>{meta}</T>
          </View>
          <Icon name="chevron" size={18} color={colors.gold} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.48)",
    backgroundColor: "rgba(7,27,42,0.58)",
  },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 2 },
  pressed: { opacity: 0.72 },
});
