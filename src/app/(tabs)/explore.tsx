import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StampCard } from "@/components/StampCard";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { AREA_COPY, ISLANDS_LINE, ISLANDS_NOTE } from "@/logic/tatelStory";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { useReels } from "@/reels/ReelHost";
import { colors, sceneForIsland } from "@/theme";
import { dockClearance } from "@/components/Dock";
import { notchPadding } from "@/components/notch";
import { BeaconBackground } from "@/components/BeaconBackground";
import { ExternalLink } from "@/components/ExternalLink";
import { openExternal } from "@/navigation/pwaNav";
import { nightGlass } from "@/components/nightGlass";

const extras = [
  { id: "vip", title: "VIP charter", line: "Be on Board: a charter you stay on for all 5 days, with local guides and private dinners. Open Tickets to start the group.", href: "/tickets" },
  { id: "show", title: "Performances", line: "The red-carpet screening of island films, and the sessions that put the work on a stage.", href: "/session/ENT-SCREENING-D3" },
  { id: "dinner", title: "Private dinners", line: "Curated dinners with a local guide, named on the VIP charter. No separate price is listed here.", href: "/tickets" },
  { id: "water", title: "Watersports", line: "Cruz Bay Watersports is the operator already named on the St. John stay list.", url: "https://bestofusvi.com/usvi-charters/boat/cruz-bay-watersports-usvi/" },
  { id: "food", title: "Food tour with a local", line: "A meal with a local guide, asked for with the VIP charter. The team confirms the guide.", href: "/tickets" },
  { id: "intro", title: "Intro tour with a local", line: "A first look at the island with a local guide. Ask for it with the VIP charter.", href: "/tickets" },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum } = program;
  const { openChapter } = useReels();
  const router = useRouter();

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView style={{ marginBottom: dockClearance(insets.bottom) }} contentContainerStyle={[{ paddingBottom: 24 }, notchPadding("top", 16, insets.top)]}>
        <View style={styles.intro}>
          <T variant="eyebrow" color={colors.gold}>Explore</T>
          <T variant="title" color={colors.foam}>The Virgin Islands</T>
          <T variant="small" color={colors.foam}>{ISLANDS_LINE}</T>
          <T variant="small" color={colors.foam}>{ISLANDS_NOTE}</T>
          <T variant="meta" color={colors.gold}>This page is discovery: the islands, the extras, and the stamp book. You move from island to island only by boat. Routes is that boat, and the taxi on land to the dock. The Preparation guide is documents and the border.</T>
        </View>
        <StampCard
          pillars={forum.pillars}
          onOpen={(id) => {
            if ((zoneReelIds as readonly string[]).includes(id)) openChapter(id as ReelId, { pathname: "/pillar/[id]", params: { id } });
          }}
        />
        <T variant="eyebrow" color={colors.gold} style={styles.kicker}>Island by island</T>
        {forum.pillars.map((pillar) => {
          const copy = AREA_COPY[pillar.id as keyof typeof AREA_COPY];
          return (
            <Pressable
              key={pillar.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${pillar.name} on ${pillar.island}`}
              onPress={() => openChapter(pillar.id as ReelId, { pathname: "/pillar/[id]", params: { id: pillar.id } })}
              style={styles.island}
            >
              <View style={[styles.swatch, { backgroundColor: sceneColor(pillar.id) }]} />
              <T variant="meta" color={colors.gold}>{pillar.region === "BVI" ? "British Virgin Islands" : "U.S. Virgin Islands"} · on or near {pillar.island}</T>
              <T variant="rowTitle" color={colors.foam}>{pillar.name}</T>
              {copy ? <T variant="small" color={colors.gold}>{copy.headline}</T> : null}
              {copy ? <T variant="small" color={colors.foam}>{copy.body}</T> : null}
              <View style={styles.pill}><T variant="button" color={colors.ink}>Open this island</T></View>
            </Pressable>
          );
        })}
        <T variant="eyebrow" color={colors.gold} style={styles.kicker}>Add-ons</T>
        {extras.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => {
              if (item.url) openExternal(item.url);
              else if (item.href) router.push(item.href as "/tickets");
            }}
            style={styles.island}
          >
            <T variant="rowTitle" color={colors.foam}>{item.title}</T>
            <T variant="small" color={colors.foam}>{item.line}</T>
            {item.url ? <ExternalLink href={item.url} label={item.title}>Operator site</ExternalLink> : <View style={styles.pill}><T variant="button" color={colors.ink}>Open</T></View>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function sceneColor(id: string): string {
  void sceneForIsland;
  if (id === "tech") return "#14344A";
  if (id === "ai") return "#123E3A";
  if (id === "travel") return "#1A3E55";
  if (id === "entertainment") return "#3A2A18";
  return "#241E3A";
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  intro: { marginHorizontal: 16, marginBottom: 12, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  kicker: { marginLeft: 22, marginBottom: 8, marginTop: 4 },
  island: { marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 6, borderRadius: 18, ...nightGlass },
  swatch: { height: 8, borderRadius: 99, marginBottom: 4 },
  pill: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
