import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function StaysScreen() {
  const { program } = useContent();
  const { stays } = program;
  const router = useRouter();
  return (
    <Screen edge="none">
      <StackHeader title="Accommodations" />
      <View style={styles.pad}>
        <T variant="eyebrow">Where you stay · five island stops</T>
        <T variant="title">Across the islands</T>
        <T variant="small">{stays.intro}</T>
        {stays.brochureUrl ? (
          <Pressable accessibilityRole="link" accessibilityLabel="See partner stays" onPress={() => Linking.openURL(stays.brochureUrl).catch(() => undefined)} style={styles.open}>
            <T variant="button" color={colors.ink}>See partner stays</T>
          </Pressable>
        ) : null}
      </View>
      {stays.groups.map((group) => (
        <View key={group.heading}>
          <T variant="eyebrow" style={styles.group}>
            {group.heading}
            {group.routeLabel ? ` · ${group.routeLabel}` : ""}
          </T>
          {group.intro ? <T variant="meta" style={styles.groupIntro}>{group.intro}</T> : null}
          {group.islands.map((island) => (
            <View key={island.id} style={styles.card}>
              <TappablePhoto source={sceneImages[island.image]} alt={island.imageAlt || island.island} style={styles.image} />
              <View style={styles.copy}>
                <T variant="eyebrow" numberOfLines={2}>{island.route}</T>
                <T variant="rowTitle" numberOfLines={2}>{island.island}</T>
                <T variant="meta" numberOfLines={3}>{island.dock}</T>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${island.island}`}
                  onPress={() => router.push({ pathname: "/stays/[id]", params: { id: island.id } })}
                  style={({ pressed }) => [styles.open, pressed && styles.pressed]}
                >
                  <T variant="button" color={colors.ink}>Open</T>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  group: { marginHorizontal: 12, marginTop: 8, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, ...nightGlass },
  groupIntro: { marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, ...nightGlass },
  card: { marginHorizontal: 12, marginBottom: 12, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", ...nightGlass },
  image: { height: 168, width: "100%" },
  copy: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 6, minWidth: 0 },
  open: { alignSelf: "flex-start", minHeight: 44, marginTop: 8, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  pressed: { opacity: 0.78 },
});
