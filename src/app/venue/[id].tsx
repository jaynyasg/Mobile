import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { placeById, placesForIsland, venueById } from "@/content";
import { useContent } from "@/content/provider";
import { Glass } from "@/components/Glass";
import { PlacePhoto } from "@/components/PlacePhoto";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { VenueModel } from "@/components/VenueModel";
import { colors, pad, sceneForIsland } from "@/theme";

export default function VenueScreen() {
  const { program } = useContent();
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
      <Glass style={styles.pad}>
        <T variant="eyebrow" color={colors.turquoise}>{venue.route}</T>
        <T variant="title">{venue.island}</T>
        <T variant="small">Dock · {venue.dock}</T>
        <T variant="meta">Specific session venue: to be confirmed. These are the candidate places on this island.</T>
      </Glass>
      {places.map((item) => {
        const hero = item.photos.find((photo) => photo.hero) ?? item.photos[0];
        return (
          <Link key={item.id} href={{ pathname: "/venue/[id]", params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="button" style={styles.card}>
              {hero ? <PlacePhoto photo={hero} /> : null}
              <View style={styles.copy}>
                <T variant="eyebrow" color={colors.turquoise}>{item.source === "app-addition" ? "Added in the app" : "Accommodations"}</T>
                <T variant="rowTitle">{item.name}</T>
                <T variant="meta">{item.photos.length} photos{item.models.length ? ` · ${item.models.length} 3D models` : ""}</T>
              </View>
            </Pressable>
          </Link>
        );
      })}
      <Glass style={styles.pad}>
        <T variant="meta">{venue.note}</T>
      </Glass>
      {[{ title: "On the boat", links: venue.boat }, { title: "On the beach or on land", links: venue.land }].map((section) => (
        <Glass key={section.title} style={styles.pad}>
          <T variant="eyebrow" color={colors.turquoise}>{section.title}</T>
          {section.links.map((link) => (
            <Pressable key={link.name} accessibilityRole="link" onPress={() => link.href && Linking.openURL(link.href).catch(() => undefined)}>
              <T variant="small">{link.name}</T>
            </Pressable>
          ))}
        </Glass>
      ))}
      <T variant="meta" style={styles.note}>{program.forum.draftNotice}</T>
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
      <Glass style={styles.pad}>
        <T variant="eyebrow" color={colors.turquoise}>{place.island}</T>
        <T variant="title">{place.name}</T>
        <T variant="small">{place.sourceNote}</T>
        <T variant="meta">A candidate place. Sessions on this island are not assigned to it yet.</T>
        {place.models.length ? (
          <Pressable accessibilityRole="button" onPress={() => setShowModels((open) => !open)} style={styles.gold}>
            <T variant="button" color={colors.ink}>{showModels ? "Hide 3D" : "View in 3D"}</T>
          </Pressable>
        ) : null}
      </Glass>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {place.photos.map((photo) => (
          <Image key={photo.id} source={{ uri: photo.webp640 }} style={styles.thumb} accessibilityLabel={photo.alt} />
        ))}
      </ScrollView>
      {showModels
        ? place.models.map((model) => (
            <Glass key={model.src} style={styles.pad}>
              <T variant="eyebrow" color={colors.gold}>3D</T>
              <VenueModel src={model.src} label={model.label} />
              <T variant="meta">{model.label}</T>
            </Glass>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: pad, marginBottom: 12, gap: 6 },
  card: { marginHorizontal: pad, marginBottom: 12, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.92)", backgroundColor: "rgba(255,255,255,0.86)" },
  copy: { padding: 12, gap: 3 },
  note: { paddingHorizontal: pad, paddingBottom: 12 },
  heroSpace: { height: 180 },
  strip: { paddingHorizontal: pad, gap: 8, paddingBottom: 16 },
  thumb: { width: 112, height: 76, borderRadius: 14, backgroundColor: colors.muted },
  gold: { marginTop: 8, minHeight: 48, borderRadius: 18, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
});
