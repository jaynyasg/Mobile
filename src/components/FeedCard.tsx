import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { prefersReducedMotion } from "@/guide/stamps";
import { PhotoShade } from "./PhotoShade";
import { T } from "./Text";
import { colors } from "@/theme";

export function FeedCard({
  image,
  alt,
  kicker,
  headline,
  line,
  cta,
  onPress,
}: {
  image: string;
  alt: string;
  kicker?: string;
  headline: string;
  line: string;
  cta: string;
  onPress: () => void;
}) {
  const [reduce, setReduce] = useState(true);
  const [pressed, setPressed] = useState(false);
  useEffect(() => setReduce(prefersReducedMotion()), []);
  return (
    <View style={[styles.card, !reduce && pressed && styles.pressed]}>
      <Image source={{ uri: image }} accessibilityLabel={alt} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <PhotoShade />
      <View style={styles.copy}>
        {kicker ? <T variant="eyebrow" color={colors.gold}>{kicker}</T> : null}
        <T variant="title" color={colors.foam} numberOfLines={2}>{headline}</T>
        <T variant="small" color={colors.foam} numberOfLines={2}>{line}</T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cta}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={[styles.pill, !reduce && styles.shimmer]}
        >
          <T variant="button" color={colors.ink}>{cta}</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 520,
    marginHorizontal: 12,
    marginBottom: 14,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#071421",
  },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  copy: {
    gap: 8,
    padding: 18,
    zIndex: 1,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.2), rgba(6,14,24,0))" } as ViewStyle),
  },
  pressed: { transform: [{ scale: 0.985 }] },
  pill: {
    alignSelf: "flex-start",
    minHeight: 44,
    marginTop: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  shimmer: {
    ...({
      backgroundImage: "linear-gradient(100deg, #E4C56A 0%, #FFE08A 42%, #F4D78A 58%, #E4C56A 100%)",
      backgroundSize: "200% 100%",
      animation: "tatel-shimmer 3.2s ease infinite",
    } as ViewStyle),
  },
});

if (typeof document !== "undefined" && !document.getElementById("tatel-shimmer")) {
  const style = document.createElement("style");
  style.id = "tatel-shimmer";
  style.textContent = "@keyframes tatel-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } } @keyframes tatel-stamp { from { transform: scale(0.82); } to { transform: scale(1); } } @media (prefers-reduced-motion: reduce) { [style*='tatel-shimmer'], [style*='tatel-stamp'] { animation: none !important; } }";
  document.head.appendChild(style);
}
