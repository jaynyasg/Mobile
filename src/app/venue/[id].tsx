import { Link, useLocalSearchParams } from "expo-router";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { venueById } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { VenueModel } from "@/components/VenueModel";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";

export default function VenueScreen() {
  const { program } = useContent();
  const { sessions, sampleModel } = program;
  const { id } = useLocalSearchParams<{ id: string }>();
  const venue = venueById(id ?? "");
  if (!venue) {
    return (
      <Screen edge="none">
        <StackHeader title="Venue" />
        <T variant="body" style={{ padding: pad }}>This island stop is not in the accommodations list.</T>
      </Screen>
    );
  }
  const photo = venue.photos[0];
  const image = photo && sceneImages[photo.src] ? sceneImages[photo.src] : undefined;
  const here = sessions.filter((session) => session.venue.venueId === venue.id);
  const modelSrc = venue.model || sampleModel.src;
  const modelLabel = venue.model ? `${venue.name} model` : sampleModel.label;

  return (
    <Screen edge="none">
      <StackHeader title={venue.name} />
      {image ? <Image source={image} style={styles.image} resizeMode="cover" accessibilityLabel={photo?.alt} /> : null}
      <View style={styles.pad}>
        <T variant="eyebrow">{venue.route}</T>
        <T variant="title">{venue.island}</T>
        <T variant="small">Dock · {venue.dock}</T>
        <T variant="meta">Specific venue: to be confirmed</T>
        <T variant="meta">{venue.note}</T>
      </View>
      <View style={styles.pad}>
        <T variant="eyebrow">3D</T>
        <VenueModel src={modelSrc} label={modelLabel} />
        <T variant="meta">{modelLabel}</T>
      </View>
      {[{ title: "On the boat", links: venue.boat }, { title: "On the beach or on land", links: venue.land }].map((section) => (
        <View key={section.title} style={styles.pad}>
          <T variant="eyebrow">{section.title}</T>
          {section.links.map((link) =>
            link.localDeck ? (
              <Link key={link.name} href="/deck" asChild>
                <Pressable accessibilityRole="button" style={styles.link}>
                  <T variant="rowTitle">{link.name}</T>
                  <T variant="meta">Deck-plan pages included with the app. The original PDF is hosted with the website.</T>
                </Pressable>
              </Link>
            ) : (
              <Pressable key={link.name} accessibilityRole="link" style={styles.link} onPress={() => link.href && Linking.openURL(link.href).catch(() => undefined)}>
                <T variant="rowTitle">{link.name}</T>
                {link.href ? <T variant="meta">{link.href}</T> : null}
              </Pressable>
            ),
          )}
        </View>
      ))}
      <T variant="eyebrow" style={styles.count}>
        {here.length} sessions at this island stop
      </T>
      {here.slice(0, 8).map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 180, width: "100%" },
  pad: { paddingHorizontal: pad, paddingBottom: 12, gap: 6 },
  link: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 2 },
  count: { paddingHorizontal: pad, marginBottom: 8 },
});
