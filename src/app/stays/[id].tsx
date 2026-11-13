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
import { nightGlass } from "@/components/nightGlass";

export default function StayScreen() {
  useContent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const island = stayById(id ?? "");
  if (!island) {
    return (
      <Screen edge="none">
        <StackHeader title="Stay" />
        <T variant="body" style={{ padding: pad }}>That stay is not on the list.</T>
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
              <View key={provider.name} style={styles.link}>
                <T variant="rowTitle" numberOfLines={2}>{provider.name}</T>
                <Link href="/deck" asChild>
                  <Pressable accessibilityRole="button" accessibilityLabel={`See ${provider.name}`} style={styles.open}>
                    <T variant="button" color={colors.ink}>See the boat</T>
                  </Pressable>
                </Link>
              </View>
            ) : (
              <View key={provider.name} style={styles.link}>
                <T variant="rowTitle" numberOfLines={2}>{provider.name}</T>
                {provider.href ? (
                  <Pressable accessibilityRole="link" accessibilityLabel={`Visit ${provider.name}`} onPress={() => Linking.openURL(provider.href!).catch(() => undefined)} style={styles.open}>
                    <T variant="button" color={colors.ink}>Visit website</T>
                  </Pressable>
                ) : null}
              </View>
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
  pad: { marginHorizontal: 12, marginTop: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  section: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  link: { gap: 8, paddingVertical: 8 },
  open: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, gap: 4 },
});
