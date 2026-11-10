import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { placesForIsland } from "@/content";
import { useContent } from "@/content/provider";
import { Glass } from "@/components/Glass";
import { PhotoShade } from "@/components/PhotoShade";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { backgrounds } from "@/components/backgrounds";
import { colors } from "@/theme";

export default function VenuesTab() {
  const { program } = useContent();
  return (
    <Screen docked photo={backgrounds.venues.day} night={backgrounds.venues.night} phase={backgrounds.venues.phase}>
      <Glass tone="dark" style={styles.header}>
        <T variant="eyebrow" color={colors.gold}>Islands</T>
        <T variant="title" foil>Venues</T>
      </Glass>
      {program.venues.map((venue) => (
        <View key={venue.id}>
          <Glass tone="dark" style={styles.island}>
            <T variant="eyebrow" color={colors.gold}>{venue.island}</T>
          </Glass>
          {placesForIsland(venue.island).map((place) => {
            const hero = place.photos.find((photo) => photo.hero) ?? place.photos[0];
            return (
              <Link key={place.id} href={{ pathname: "/venue/[id]", params: { id: place.id } }} asChild>
                <Pressable accessibilityRole="button" style={styles.card}>
                  {hero ? <Image source={{ uri: hero.webp1280 }} style={styles.photo} accessibilityIgnoresInvertColors /> : null}
                  <PhotoShade />
                  <View style={styles.copy}>
                    <T variant="rowTitle" color={colors.onDark}>{place.name}</T>
                    <T variant="meta" color={colors.gold}>{place.photos.length} photos{place.models.length ? " · 3D" : ""}</T>
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
  header: { marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, gap: 4 },
  island: { alignSelf: "flex-start", marginLeft: 22, marginTop: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  card: { marginHorizontal: 22, marginBottom: 14, height: 168, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.9)" },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  copy: { padding: 14, gap: 2 },
});
