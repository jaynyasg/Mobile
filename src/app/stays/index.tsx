import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { scenes as sceneImages } from "@/images";
import { resolveUri } from "@/components/TappablePhoto";
import { colors, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";
import { ExternalLink } from "@/components/ExternalLink";
import { StepBridge } from "@/components/StepBridge";

export default function StaysScreen() {
  const { program } = useContent();
  const { stays, forum } = program;
  const params = useLocalSearchParams<{ areas?: string }>();
  const router = useRouter();
  const wanted = new Set((params.areas ?? "").split(",").map((item) => item.trim()).filter(Boolean));
  const islands = new Set(forum.pillars.filter((pillar) => wanted.has(pillar.id)).map((pillar) => pillar.island));
  const groups = islands.size
    ? stays.groups
      .map((group) => ({ ...group, islands: group.islands.filter((island) => islands.has(island.island)) }))
      .filter((group) => group.islands.length > 0)
    : stays.groups;
  return (
    <Screen edge="none">
      <StackHeader title="Accommodations" />
      <StepBridge id="stay" />
      <View style={styles.pad}>
        <T variant="eyebrow">Where you stay · five island stops</T>
        <T variant="title">Across the islands</T>
        <T variant="small">{stays.intro}</T>
        {islands.size ? <T variant="meta" color={colors.gold}>Your islands</T> : null}
        {stays.brochureUrl ? (
          <ExternalLink href={stays.brochureUrl} label="See partner stays">See partner stays</ExternalLink>
        ) : null}
      </View>
      {groups.map((group) => (
        <View key={group.heading}>
          <T variant="eyebrow" style={styles.group}>
            {group.heading}
            {group.routeLabel ? ` · ${group.routeLabel}` : ""}
          </T>
          {group.intro ? <T variant="meta" style={styles.groupIntro}>{group.intro}</T> : null}
          {group.islands.map((island) => (
            <Pressable key={island.id} accessibilityRole="button" accessibilityLabel={`Open ${island.island}`} onPress={() => router.push({ pathname: "/stays/[id]", params: { id: island.id } })} style={styles.card}>
              <Image pointerEvents="none" source={{ uri: resolveUri(sceneImages[island.image]) ?? "" }} accessibilityLabel={island.imageAlt || island.island} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
              <View pointerEvents="none" style={styles.copy}>
                <T variant="eyebrow" numberOfLines={2}>{island.route}</T>
                <T variant="rowTitle" numberOfLines={2}>{island.island}</T>
                <T variant="meta" numberOfLines={3}>{island.dock}</T>
                <View style={styles.open}>
                  <T variant="button" color={colors.ink}>Open</T>
                </View>
              </View>
            </Pressable>
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
