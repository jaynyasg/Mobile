import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { placesForIsland } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { PageHeader } from "@/components/ui";
import { colors, pad, scenePhotos } from "@/theme";

export default function VenuesTab() {
  const { program } = useContent();
  return (
    <Screen docked photo={scenePhotos.community}>
      <PageHeader kicker="Daylight" title="Venues" subtitle="Candidate places on each island. A session’s specific venue is still to be confirmed." />
      {program.venues.map((venue) => (
        <View key={venue.id} style={styles.group}>
          <T variant="eyebrow" color={colors.turquoise} style={styles.island}>{venue.island}</T>
          {placesForIsland(venue.island).map((place) => {
            const hero = place.photos.find((photo) => photo.hero) ?? place.photos[0];
            return (
              <Link key={place.id} href={{ pathname: "/venue/[id]", params: { id: place.id } }} asChild>
                <Pressable accessibilityRole="button" style={styles.card}>
                  {hero ? <Image source={{ uri: hero.webp640 }} style={styles.photo} accessibilityIgnoresInvertColors /> : null}
                  <View style={styles.copy}>
                    <T variant="rowTitle">{place.name}</T>
                    <T variant="meta">{place.photos.length} photos{place.models.length ? ` · ${place.models.length} 3D` : ""}</T>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 8 },
  island: { paddingHorizontal: pad, marginBottom: 8 },
  card: {
    marginHorizontal: pad,
    marginBottom: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  photo: { width: "100%", height: 140 },
  copy: { padding: 12, gap: 2 },
});
