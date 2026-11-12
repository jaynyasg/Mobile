import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";

export default function StaysScreen() {
  const { program } = useContent();
  const { stays } = program;
  return (
    <Screen edge="none">
      <StackHeader title="Accommodations" />
      <View style={styles.pad}>
        <T variant="eyebrow">Where you stay · five island stops</T>
        <T variant="title">Across the islands</T>
        <T variant="small">{stays.intro}</T>
        <T variant="meta">{stays.brochureNote}</T>
        <T variant="meta">{stays.brochureUrl}</T>
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
              <Link href={{ pathname: "/stays/[id]", params: { id: island.id } }} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={island.island} style={({ pressed }) => [styles.copy, pressed && styles.pressed]}>
                  <View style={styles.copyText}>
                    <T variant="eyebrow">{island.route}</T>
                    <T variant="rowTitle">{island.island}</T>
                    <T variant="meta">{island.dock}</T>
                  </View>
                  <T variant="button" color={colors.brass}>Open</T>
                </Pressable>
              </Link>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, backgroundColor: "rgba(247,244,239,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(11,27,43,0.12)" },
  group: { marginHorizontal: 12, marginTop: 8, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(247,244,239,0.96)" },
  groupIntro: { marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(247,244,239,0.96)" },
  card: { marginHorizontal: 12, marginBottom: 12, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(11,27,43,0.12)", backgroundColor: "rgba(247,244,239,0.96)" },
  image: { height: 140, width: "100%" },
  copy: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  copyText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.78 },
});
