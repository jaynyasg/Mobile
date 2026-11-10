import { Link, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { placeById, placesForIsland, venueById } from "@/content";
import { useContent } from "@/content/provider";
import { PlacePhoto } from "@/components/PlacePhoto";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { VenueModel } from "@/components/VenueModel";
import { colors, pad } from "@/theme";

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
    <Screen edge="none">
      <StackHeader title={venue.island} />
      <View style={styles.pad}>
        <T variant="eyebrow">{venue.route}</T>
        <T variant="title">{venue.island}</T>
        <T variant="small">Dock · {venue.dock}</T>
        <T variant="meta">Specific session venue: to be confirmed. These are the candidate places on this island.</T>
      </View>
      {places.map((item) => {
        const hero = item.photos.find((photo) => photo.hero) ?? item.photos[0];
        return (
          <Link key={item.id} href={{ pathname: "/venue/[id]", params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="button" style={styles.card}>
              {hero ? <PlacePhoto photo={hero} /> : null}
              <View style={styles.copy}>
                <T variant="eyebrow">{item.source === "app-addition" ? "Added in the app" : "Accommodations"}</T>
                <T variant="rowTitle">{item.name}</T>
                <T variant="meta">{item.photos.length} photos{item.models.length ? ` · ${item.models.length} 3D models` : ""}</T>
              </View>
            </Pressable>
          </Link>
        );
      })}
      <View style={styles.pad}>
        <T variant="meta">{venue.note}</T>
      </View>
      {[{ title: "On the boat", links: venue.boat }, { title: "On the beach or on land", links: venue.land }].map((section) => (
        <View key={section.title} style={styles.pad}>
          <T variant="eyebrow">{section.title}</T>
          {section.links.map((link) => (
            <Pressable key={link.name} accessibilityRole="link" onPress={() => link.href && Linking.openURL(link.href).catch(() => undefined)}>
              <T variant="small">{link.name}</T>
            </Pressable>
          ))}
        </View>
      ))}
      <T variant="meta" style={styles.pad}>{program.forum.draftNotice}</T>
    </Screen>
  );
}

function PlaceScreen({ placeId }: { placeId: string }) {
  const place = placeById(placeId);
  if (!place) return null;
  const hero = place.photos.find((photo) => photo.hero) ?? place.photos[0];
  const rest = place.photos.filter((photo) => photo !== hero);
  return (
    <Screen edge="none">
      <StackHeader title={place.name} />
      {hero ? <PlacePhoto photo={hero} eager /> : null}
      <View style={styles.pad}>
        <T variant="eyebrow">{place.island}</T>
        <T variant="title">{place.name}</T>
        <T variant="small">{place.sourceNote}</T>
        <T variant="meta">A candidate place. Sessions on this island are not assigned to it yet.</T>
      </View>
      {place.models.map((model) => (
        <View key={model.src} style={styles.pad}>
          <T variant="eyebrow">3D</T>
          <VenueModel src={model.src} label={model.label} />
          <T variant="meta">{model.label}</T>
        </View>
      ))}
      <T variant="eyebrow" style={styles.count}>Gallery</T>
      {rest.map((photo) => (
        <View key={photo.id} style={styles.frame}>
          <PlacePhoto photo={photo} />
          {photo.uncertain ? <T variant="meta" style={styles.caption}>Uncertain match. Kept out of the hero.</T> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: pad, paddingBottom: 12, gap: 6 },
  card: { marginHorizontal: pad, marginBottom: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised },
  copy: { padding: 12, gap: 3 },
  count: { paddingHorizontal: pad, marginBottom: 8 },
  frame: { marginBottom: 8 },
  caption: { paddingHorizontal: pad, paddingTop: 4 },
});
