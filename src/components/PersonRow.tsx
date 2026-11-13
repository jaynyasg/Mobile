import { Href, Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "@/theme";
import { clip } from "./clip";
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
      <View style={styles.main}>
        <Link href={href} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => [styles.hit, pressed && styles.pressed]}>
            <View style={styles.copy}>
              <T variant="rowTitle" numberOfLines={2}>{name}</T>
              {meta.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => (
                <T key={line} variant="meta">{line}</T>
              ))}
            </View>
            <Icon name="chevron" size={18} color={colors.gold} />
          </Pressable>
        </Link>
      </View>
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
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  main: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, overflow: "hidden" },
  hit: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  copy: { ...clip, gap: 2 },
  pressed: { opacity: 0.72 },
});
