import { Link, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { credits, pillarById, scenes, stayIslands } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";

export default function PillarScreen() {
  const { program } = useContent();
  const { sessions } = program;
  const { id } = useLocalSearchParams<{ id: string }>();
  const pillar = pillarById(id ?? "");
  if (!pillar) {
    return (
      <Screen edge="none">
        <StackHeader title="Pillar" />
        <T variant="body" style={{ padding: pad }}>This pillar is not in the draft.</T>
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
        <Image source={sceneImages[scene.image]} style={styles.image} resizeMode="cover" />
        <View style={styles.shade} />
        <View style={styles.heroCopy}>
          <T variant="eyebrow" color={colors.brassSoft}>
            Planning home
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
            <T variant="small" color={colors.brass}>
              Filter the agenda to {pillar.name}
            </T>
          </Pressable>
        </Link>
        {stay ? (
          <Link href={{ pathname: "/stays/[id]", params: { id: stay.id } }} asChild>
            <Pressable accessibilityRole="button">
              <T variant="small" color={colors.brass}>
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
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(7,27,42,0.45)" },
  heroCopy: { padding: pad, gap: 4 },
  pad: { padding: pad, gap: 8 },
  count: { paddingHorizontal: pad, marginBottom: 8 },
});
