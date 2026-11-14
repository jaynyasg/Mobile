import { Href, Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { type ReelId } from "@/content/reels";
import { useReels } from "@/reels/ReelHost";
import { colors } from "@/theme";
import { clip } from "./clip";
import { TILE_TOP, nightGlass } from "./nightGlass";
import { Icon, IconName } from "./Icon";
import { T } from "./Text";

export function ActionTile({
  href,
  icon,
  label,
  detail,
  reelId,
}: {
  href: Href;
  icon: IconName;
  label: string;
  detail: string;
  reelId?: ReelId;
}) {
  const [hover, setHover] = useState(false);
  const { openChapter } = useReels();
  const tile = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onPress={reelId ? () => openChapter(reelId, href) : undefined}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <View style={[styles.tile, hover && styles.hover]}>
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={colors.pine} />
        </View>
        <View style={styles.copy}>
          <T variant="rowTitle" numberOfLines={2}>{label}</T>
          <T variant="meta" numberOfLines={3}>{detail}</T>
        </View>
        <Icon name="chevron" size={18} color={colors.gold} />
      </View>
    </Pressable>
  );
  if (reelId) return tile;
  return (
    <Link href={href} asChild>
      {tile}
    </Link>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: 56 },
  tile: {
    ...nightGlass,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    ...({
      backgroundImage: `linear-gradient(180deg, ${TILE_TOP} 0%, rgba(7,27,42,0.58) 100%)`,
    } as ViewStyle),
  },
  hover: { borderColor: colors.gold },
  pressed: { opacity: 0.78 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  copy: { ...clip, gap: 2 },
});
