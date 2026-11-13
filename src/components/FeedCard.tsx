import { Image, Pressable, StyleSheet, View, ViewStyle } from "react-native";
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
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} accessibilityLabel={alt} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <PhotoShade />
      <View style={styles.copy}>
        {kicker ? <T variant="eyebrow" color={colors.gold}>{kicker}</T> : null}
        <T variant="title" color={colors.foam} numberOfLines={2}>{headline}</T>
        <T variant="small" color={colors.foam} numberOfLines={2}>{line}</T>
        <Pressable accessibilityRole="button" accessibilityLabel={cta} onPress={onPress} style={styles.pill}>
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
});
