import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { stayById } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { TappablePhoto } from "@/components/TappablePhoto";
import { scenes as sceneImages } from "@/images";
import { colors, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";
import { ExternalLink } from "@/components/ExternalLink";
import { StepBridge } from "@/components/StepBridge";
import { confirmAccommodation, readIntake } from "@/logic/intake";
import { webStorage } from "@/welcome";

export default function StayScreen() {
  useContent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const island = stayById(id ?? "");
  const [chosen, setChosen] = useState(() => readIntake(webStorage())?.accommodation);
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
        <T variant="small">Choose a property and visit its website to check rooms and book. Once your reservation is confirmed, save your accommodation below.</T>
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
                  <ExternalLink href={provider.href} label={`Check availability at ${provider.name}`}>Check availability & book</ExternalLink>
                ) : null}
                {!/boat/i.test(section.heading) && readIntake(webStorage()) ? <Pressable accessibilityRole="button" accessibilityLabel={`I have booked ${provider.name}`} onPress={() => { const accommodation = { island: island.island, name: provider.name }; confirmAccommodation(webStorage(), accommodation); setChosen(accommodation); }} style={styles.confirm}><T variant="button" color={colors.gold}>{chosen?.name === provider.name && chosen.island === island.island ? "✓ Saved as my accommodation" : "I have booked here"}</T></Pressable> : null}
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
      <StepBridge id="stay" footer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 200, width: "100%" },
  pad: { marginHorizontal: 12, marginTop: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  section: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  link: { gap: 8, paddingVertical: 8 },
  confirm: { minHeight: 44, paddingVertical: 12 },
  open: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, gap: 4 },
});
