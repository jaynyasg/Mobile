import { Href, Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";
import { TappablePhoto } from "./TappablePhoto";

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
      {photo ? <TappablePhoto source={photo} alt={name} style={styles.photo} resizeMode="contain" /> : null}
      <Link href={href} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
          <View style={styles.copy}>
            <T variant="rowTitle">{name}</T>
            <T variant="meta">{meta}</T>
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
    backgroundColor: "rgba(7,27,42,0.84)",
  },
  photo: { width: 52, height: 64, backgroundColor: "rgba(7,27,42,0.5)" },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 2 },
  pressed: { opacity: 0.72 },
});
