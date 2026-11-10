import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { placeById, placesForIsland, venueById } from "@/content";
import { PhotoShade } from "@/components/PhotoShade";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { VenueModel } from "@/components/VenueModel";
import { colors, pad, sceneForIsland } from "@/theme";

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = placeById(id ?? "");
  if (place) return <PlaceScreen placeId={place.id} />;
  const venue = venueById(id ?? "");
  if (!venue) {
    return (
      <Screen edge="none">
        <StackHeader title="Venue" />
        <T variant="body" style={{ padding: pad }}>This stop is not in the venue list.</T>
      </Screen>
    );
  }
  const places = placesForIsland(venue.island);
  return (
    <Screen edge="none" photo={sceneForIsland(venue.island)}>
      <StackHeader title={venue.island} />
      <View style={styles.intro}>
        <T variant="eyebrow" color={colors.gold}>{venue.route}</T>
        <T variant="title" color={colors.onDark}>{venue.island}</T>
        <T variant="meta" color={colors.onDarkSoft}>Dock · {venue.dock}</T>
      </View>
      {places.map((item) => {
        const hero = item.photos.find((photo) => photo.hero) ?? item.photos[0];
        return (
          <Link key={item.id} href={{ pathname: "/venue/[id]", params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="button" style={styles.card}>
              {hero ? <Image source={{ uri: hero.webp640 }} style={styles.photo} accessibilityIgnoresInvertColors /> : null}
              <PhotoShade />
              <View style={styles.copy}>
                <T variant="rowTitle" color={colors.onDark}>{item.name}</T>
                <T variant="meta" color={colors.gold}>{item.photos.length} photos{item.models.length ? " · 3D" : ""}</T>
              </View>
            </Pressable>
          </Link>
        );
      })}
      <T variant="meta" color={colors.onDarkSoft} style={styles.note}>{venue.note}</T>
      {[{ title: "On the boat", links: venue.boat }, { title: "On the beach or on land", links: venue.land }].map((section) => (
        <View key={section.title} style={styles.note}>
          <T variant="eyebrow" color={colors.gold}>{section.title}</T>
          {section.links.map((link) => (
            <Pressable key={link.name} accessibilityRole="link" onPress={() => link.href && Linking.openURL(link.href).catch(() => undefined)}>
              <T variant="small" color={colors.onDark}>{link.name}</T>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

function PlaceScreen({ placeId }: { placeId: string }) {
  const place = placeById(placeId);
  const [showModels, setShowModels] = useState(false);
  if (!place) return null;
  const hero = place.photos.find((photo) => photo.hero) ?? place.photos[0];
  return (
    <Screen edge="none" photo={hero?.webp1280 ?? sceneForIsland(place.island)} statusBar="light">
      <StackHeader title={place.name} />
      <View style={styles.heroSpace} />
      <View style={styles.intro}>
        <T variant="eyebrow" color={colors.gold}>{place.island}</T>
        <T variant="title" color={colors.onDark}>{place.name}</T>
        <T variant="meta" color={colors.onDarkSoft}>A candidate place. Not assigned to a session yet.</T>
        {place.models.length ? (
          <Pressable accessibilityRole="button" onPress={() => setShowModels((open) => !open)} style={styles.gold}>
            <T variant="button" color={colors.ink}>{showModels ? "Hide 3D" : "View in 3D"}</T>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {place.photos.map((photo) => (
          <Image key={photo.id} source={{ uri: photo.webp640 }} style={styles.thumb} accessibilityLabel={photo.alt} />
        ))}
      </ScrollView>
      {showModels
        ? place.models.map((model) => (
            <View key={model.src} style={styles.model}>
              <T variant="eyebrow" color={colors.gold}>3D</T>
              <VenueModel src={model.src} label={model.label} />
              <T variant="meta" color={colors.onDarkSoft}>{model.label}</T>
            </View>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 22, paddingTop: 28, gap: 6, paddingBottom: 8 },
  card: { marginHorizontal: 22, marginBottom: 14, height: 160, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end" },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  copy: { padding: 12, gap: 2 },
  note: { paddingHorizontal: 22, paddingBottom: 12, gap: 6 },
  heroSpace: { height: 280 },
  model: { marginHorizontal: 22, marginBottom: 16, gap: 8 },
  strip: { paddingHorizontal: pad, gap: 8, paddingBottom: 16 },
  thumb: { width: 112, height: 76, borderRadius: 14, backgroundColor: colors.muted },
  gold: { marginTop: 8, minHeight: 48, borderRadius: 18, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
});
