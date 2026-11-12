import { Link, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { stayById } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";

export default function StayScreen() {
  useContent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const island = stayById(id ?? "");
  if (!island) {
    return (
      <Screen edge="none">
        <StackHeader title="Stay" />
        <T variant="body" style={{ padding: pad }}>This stop is not in the brochure extract.</T>
      </Screen>
    );
  }

  return (
    <Screen edge="none">
      <StackHeader title={island.island} />
      <TappablePhoto source={sceneImages[island.image]} alt={island.imageAlt || island.island} style={styles.image} />
      <View style={styles.pad}>
        <T variant="eyebrow">{island.route}</T>
        <T variant="title">{island.island}</T>
        <T variant="small">{island.dock}</T>
        <T variant="meta">{island.imageAlt}</T>
      </View>
      {island.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <T variant="eyebrow">{section.heading}</T>
          {section.providers.map((provider) =>
            provider.localDeck ? (
              <Link key={provider.name} href="/deck" asChild>
                <Pressable accessibilityRole="button" style={styles.link}>
                  <T variant="rowTitle">{provider.name}</T>
                  <T variant="meta">Local page images from the supplied deck. The original PDF was not in this export.</T>
                </Pressable>
              </Link>
            ) : (
              <Pressable
                key={provider.name}
                accessibilityRole="link"
                style={styles.link}
                onPress={() => {
                  if (provider.href) Linking.openURL(provider.href).catch(() => undefined);
                }}
              >
                <T variant="rowTitle">{provider.name}</T>
                {provider.href ? <T variant="meta">{provider.href}</T> : null}
              </Pressable>
            ),
          )}
          {section.notes.map((note) => (
            <T key={note} variant="meta">
              {note}
            </T>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 200, width: "100%" },
  pad: { padding: pad, gap: 6 },
  section: { paddingHorizontal: pad, paddingBottom: 16, gap: 8 },
  link: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 2 },
});
