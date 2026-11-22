import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { scenes as sceneImages } from "@/images";
import { resolveUri } from "@/components/TappablePhoto";
import { colors } from "@/theme";
import { nightGlass } from "@/components/nightGlass";
import { ExternalLink } from "@/components/ExternalLink";
import { StepBridge } from "@/components/StepBridge";
import { useIntake } from "@/logic/useIntake";
import { suggestedStayIslands } from "@/logic/staySuggestions";
import { Disclosure } from "@/components/Disclosure";

export default function StaysScreen() {
  const { program } = useContent();
  const { stays } = program;
  const params = useLocalSearchParams<{ areas?: string }>();
  const router = useRouter();
  const intake = useIntake();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [showAll, setShowAll] = useState(false);
  const areas = [...(intake?.areas ?? (params.areas ?? "").split(",").map((item) => item.trim()).filter(Boolean))];
  const interests = intake?.interests ?? [];
  const preferenceKey = JSON.stringify([areas, interests]);
  useEffect(() => {
    setShowAll(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [preferenceKey]);
  const personalized = areas.length > 0 || interests.length > 0;
  const islands = new Set(suggestedStayIslands(program.sessions, { areas, interests }));
  const groups = personalized && !showAll
    ? stays.groups
      .map((group) => ({ ...group, islands: group.islands.filter((island) => islands.has(island.island)) }))
      .filter((group) => group.islands.length > 0)
    : stays.groups;
  return (
    <Screen edge="none" scrollRef={scrollRef}>
      <StackHeader title="Accommodations" />
      <View style={styles.pad}>
        <T variant="title">{personalized && !showAll ? "Your islands" : "Choose your island"}</T>
        <T variant="small">{personalized && !showAll ? groups.length ? "Matched to your session interests. Choose an island to see hotels and villas." : "No stays are listed near sessions matching these answers yet. Explore all islands below." : "Choose your island, then find a hotel or villa to call home."}</T>
        {intake?.ticketPreference === "vip" ? <T variant="small">Board includes a stay aboard the charter. These options are for extra nights ashore.</T> : null}
      </View>
      <View testID="stay-island-options">
      {groups.map((group) => (
        <View key={group.heading}>
          {(!personalized || showAll) ? <T variant="eyebrow" style={styles.group}>
            {group.heading}
            {group.routeLabel ? ` · ${group.routeLabel}` : ""}
          </T> : null}
          {group.islands.map((island) => (
            <Pressable key={island.id} accessibilityRole="button" accessibilityLabel={`Open ${island.island}`} onPress={() => router.push({ pathname: "/stays/[id]", params: { id: island.id } })} style={styles.card}>
              <T variant="headline" style={styles.islandName}>{island.island}</T>
              <Image pointerEvents="none" source={{ uri: resolveUri(sceneImages[island.image]) ?? "" }} accessibilityLabel={island.imageAlt || island.island} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
              <View pointerEvents="none" style={styles.copy}>
                {personalized && !showAll ? <T variant="eyebrow">{group.heading}</T> : null}
                <T variant="eyebrow" numberOfLines={2}>{island.route}</T>
                <T variant="meta" numberOfLines={3}>{island.dock}</T>
                <View style={styles.open}>
                  <T variant="button" color={colors.ink}>Find a stay here</T>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
      </View>
      <View style={styles.pad}>
        {personalized ? <Pressable accessibilityRole="button" onPress={() => { setShowAll(!showAll); scrollRef.current?.scrollTo({ y: 0, animated: false }); }} style={styles.open}><T variant="button" color={colors.ink}>{showAll ? "Show my suggested islands" : "See all islands"}</T></Pressable> : null}
        <Disclosure label="How accommodation booking works"><T variant="small">Open a property to browse and book in a provider window. Some sites require a new tab; your TATEL plan stays saved. Confirm availability, rates, and cancellation terms with the property. Your ticket does not reserve a hotel room.</T></Disclosure>
        {stays.brochureUrl ? <ExternalLink href={stays.brochureUrl} label="See partner stays">See partner stays</ExternalLink> : null}
      </View>
      <StepBridge id="stay" footer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  group: { marginHorizontal: 12, marginTop: 8, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, ...nightGlass },
  card: { marginHorizontal: 12, marginBottom: 12, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.48)", ...nightGlass },
  image: { height: 168, width: "100%" },
  islandName: { paddingHorizontal: 16, paddingVertical: 12 },
  copy: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 6, minWidth: 0 },
  open: { alignSelf: "flex-start", minHeight: 44, marginTop: 8, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  pressed: { opacity: 0.78 },
});
