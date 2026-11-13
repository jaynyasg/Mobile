import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedCard } from "@/components/FeedCard";
import { ZoneMap } from "@/components/ZoneMap";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { islandTrackLabel } from "@/content/labels";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { islandStamp, prefersReducedMotion, readStamps } from "@/guide/stamps";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { dockClearance } from "@/components/Dock";
import { BeaconBackground } from "@/components/BeaconBackground";
import { useApp } from "@/store";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum, sessions } = program;
  const { openChapter } = useReels();
  const { state } = useApp();
  const reduced = prefersReducedMotion();
  const stamps = new Set(readStamps(localReelStore()));
  const progress: Record<string, number> = {};
  for (const pillar of forum.pillars) {
    const saved = sessions.filter((session) => session.pillarId === pillar.id && state.favoriteIds.includes(session.id)).length;
    const visited = stamps.has(islandStamp(pillar.id)) || isExplored(localReelStore(), pillar.id);
    progress[pillar.id] = visited ? 1 : Math.min(0.65, saved * 0.3);
  }

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView style={{ marginBottom: dockClearance(insets.bottom) }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
        <T variant="eyebrow" color={colors.gold} style={styles.kicker}>Explore</T>
        <ZoneMap
          progress={progress}
          reduced={reduced}
          onPress={(id) => openChapter(id as ReelId, { pathname: "/pillar/[id]", params: { id } })}
        />
        <FeedCard
          image={sceneForIsland("St. Thomas")}
          alt="A route across the water"
          kicker="Transport"
          headline="Sample routes"
          line="Powerboat, ferries, or a yacht."
          cta="Open"
          onPress={() => openChapter("transport", "/transport")}
        />
        {forum.pillars.map((pillar) => {
          const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
          const explored = isExplored(localReelStore(), pillar.id);
          const label = islandTrackLabel(pillar.island, pillar.name);
          return (
            <FeedCard
              key={pillar.id}
              image={sceneForIsland(pillar.island)}
              alt={label}
              headline={label}
              line={explored ? "You have opened this island." : "Open this island."}
              cta="Open"
              done={explored}
              onPress={() => {
                if (zoneId) openChapter(zoneId, { pathname: "/pillar/[id]", params: { id: pillar.id } });
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  kicker: { marginLeft: 22, marginBottom: 10 },
});
