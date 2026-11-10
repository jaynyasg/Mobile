import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
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
            <Link key={island.id} href={{ pathname: "/stays/[id]", params: { id: island.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.card}>
                <Image source={sceneImages[island.image]} style={styles.image} resizeMode="cover" />
                <View style={styles.copy}>
                  <T variant="eyebrow">{island.route}</T>
                  <T variant="rowTitle">{island.island}</T>
                  <T variant="meta">{island.dock}</T>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: pad, gap: 8 },
  group: { paddingHorizontal: pad, marginTop: 8 },
  groupIntro: { paddingHorizontal: pad, paddingBottom: 8 },
  card: { marginHorizontal: pad, marginBottom: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised },
  image: { height: 140, width: "100%" },
  copy: { padding: 12, gap: 3 },
});
