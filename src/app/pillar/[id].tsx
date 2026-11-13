import { Link, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { credits, pillarById, scenes, stayIslands } from "@/content";
import { zoneReelIds } from "@/content/reels";
import { useReels } from "@/reels/ReelHost";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function PillarScreen() {
  const { program } = useContent();
  const { sessions } = program;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { markZone } = useReels();
  const pillar = pillarById(id ?? "");
  useEffect(() => {
    if (id && (zoneReelIds as readonly string[]).includes(id)) markZone(id);
  }, [id, markZone]);
  if (!pillar) {
    return (
      <Screen edge="none">
        <StackHeader title="Track" />
        <T variant="body" style={{ padding: pad }}>This track is not in the program.</T>
      </Screen>
    );
  }
  const stay = stayIslands().find((island) => island.island === pillar.island);
  const scene = scenes.find((item) => item.image === stay?.image) ?? scenes[0];
  const rows = sessions.filter((session) => session.pillarId === pillar.id);

  return (
    <Screen edge="none">
      <StackHeader title={pillar.name} />
      <View style={styles.hero}>
        <TappablePhoto source={sceneImages[scene.image]} alt={scene.name} style={styles.image} />
        <View pointerEvents="none" style={styles.shade} />
        <View pointerEvents="none" style={styles.heroCopy}>
          <T variant="eyebrow" color={colors.gold}>
            {pillar.island}
          </T>
          <T variant="title" color={colors.ivory}>
            {pillar.name}
          </T>
          <T variant="small" color={colors.ivory}>
            {pillar.island} · {pillar.region}
          </T>
        </View>
      </View>
      <View style={styles.pad}>
        <T variant="small">{scene.name}</T>
        <T variant="meta">{credits.scenes}</T>
        <T variant="meta">Specific venues are to be confirmed. Sessions on this island use its accommodations stop.</T>
        <Link href={{ pathname: "/agenda", params: { pillar: pillar.id } }} asChild>
          <Pressable accessibilityRole="button">
            <T variant="small" color={colors.gold}>
              Show {pillar.name} in Sessions
            </T>
          </Pressable>
        </Link>
        {stay ? (
          <Link href={{ pathname: "/stays/[id]", params: { id: stay.id } }} asChild>
            <Pressable accessibilityRole="button">
              <T variant="small" color={colors.gold}>
                Accommodations · {stay.dock}
              </T>
            </Pressable>
          </Link>
        ) : null}
      </View>
      <T variant="eyebrow" style={styles.count}>
        {rows.length} sessions
      </T>
      {rows.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 240, justifyContent: "flex-end", overflow: "hidden" },
  image: { position: "absolute", top: 0, left: 0, right: 0, height: 240 },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(7,18,32,0.62)" },
  heroCopy: { padding: pad, gap: 4 },
  pad: { marginHorizontal: 12, marginTop: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  count: { alignSelf: "flex-start", marginLeft: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, ...nightGlass },
});
