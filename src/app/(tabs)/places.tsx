import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { placesForIsland } from "@/content";
import { useContent } from "@/content/provider";
import type { Place } from "@/content/types";
import { Glass } from "@/components/Glass";
import { PhotoShade } from "@/components/PhotoShade";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { resolveUri } from "@/components/TappablePhoto";
import { backgrounds } from "@/components/backgrounds";
import { colors } from "@/theme";

export default function VenuesTab() {
  const { program } = useContent();
  const router = useRouter();
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
              <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={place.name} onPress={() => router.push({ pathname: "/venue/[id]", params: { id: place.id } })} style={styles.card}>
                {hero ? (
                  <Image pointerEvents="none" source={{ uri: resolveUri(hero.webp1280) ?? "" }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
                ) : null}
                <PhotoShade />
                <View pointerEvents="none" style={styles.copy}>
                  <T variant="rowTitle" color={colors.onDark} numberOfLines={2}>{place.name}</T>
                  <T variant="meta" color={colors.gold} numberOfLines={2}>{place.photos.length} photos{place.models.length ? " · 3D" : ""}</T>
                  <T variant="button" color={colors.gold}>Open</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

function placeShots(place: Place) {
  return place.photos.map((photo) => ({ source: photo.webp1280 || photo.jpeg, alt: photo.alt || place.name }));
}

const styles = StyleSheet.create({
  header: { marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, gap: 4 },
  island: { alignSelf: "flex-start", marginLeft: 22, marginTop: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  card: { marginHorizontal: 22, marginBottom: 14, minHeight: 168, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.45)" },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  copy: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 2, zIndex: 1, minWidth: 0 },
});
