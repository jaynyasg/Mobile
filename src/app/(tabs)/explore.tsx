import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedCard } from "@/components/FeedCard";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { isExplored, localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { BeaconBackground } from "@/components/BeaconBackground";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum } = program;
  const { openChapter } = useReels();

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }}>
        <T variant="eyebrow" color={colors.gold} style={styles.kicker}>Explore</T>
        <FeedCard
          image={sceneForIsland("St. Thomas")}
          alt="A route across the water"
          kicker="How you move"
          headline="Sample routes"
          line="Powerboat, ferries, or a yacht. Unconfirmed."
          cta="Open"
          onPress={() => openChapter("transport", "/transport")}
        />
        {forum.pillars.map((pillar) => {
          const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
          const explored = isExplored(localReelStore(), pillar.id);
          return (
            <FeedCard
              key={pillar.id}
              image={sceneForIsland(pillar.island)}
              alt={pillar.island}
              kicker={explored ? "Explored" : "Island"}
              headline={pillar.island}
              line={pillar.name}
              cta="Enter"
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
