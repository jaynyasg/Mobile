import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRef, useState, type ComponentRef } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StampCard } from "@/components/StampCard";
import { ExperienceGuide } from "@/components/ExperienceGuide";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { ISLANDS_LINE, ISLANDS_NOTE } from "@/logic/tatelStory";
import { reels, zoneReelIds, type ReelId } from "@/content/reels";
import { useReels } from "@/reels/ReelHost";
import { colors } from "@/theme";
import { dockClearance } from "@/components/Dock";
import { notchPadding } from "@/components/notch";
import { scrollPort } from "@/components/scrollPort";
import { BeaconBackground } from "@/components/BeaconBackground";
import { ExternalLink } from "@/components/ExternalLink";
import { openExternal } from "@/navigation/pwaNav";
import { nightGlass } from "@/components/nightGlass";
import { BookingLink } from "@/components/BookingLink";
import { IslandStory } from "@/components/IslandStory";
import { IslandTime } from "@/components/IslandTime";
import { Disclosure } from "@/components/Disclosure";
import { ShareInvitation } from "@/components/ShareInvitation";

const extras = [
  { id: "vip", title: "Five days aboard", line: "Wake up on the water with Be on Board. Explore the overnight charter and start a booking for your group, or ask to share.", href: "/tickets?tier=vip" },
  { id: "show", title: "Your red-carpet moment", line: "Dress for the occasion and discover island filmmaking at the red-carpet screening. Find the session, save it, and check its latest time and location.", href: "/session/ENT-SCREENING-D3" },
  { id: "dinner", title: "Good food, great company", line: "Be on Board includes curated lunches and dinners. The team will confirm the dining plans for your charter.", href: "/tickets?tier=vip" },
  { id: "water", title: "More time on the water", line: "Explore trips and watersports with Cruz Bay Watersports on St. John. Check availability and book directly with the operator.", url: "https://bestofusvi.com/usvi-charters/boat/cruz-bay-watersports-usvi/" },
  { id: "intro", title: "See the islands with a local", line: "Ask the Be on Board team about local guides and island experiences when you arrange your charter.", href: "/tickets?tier=vip" },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { forum } = program;
  const { openChapter } = useReels();
  const router = useRouter();
  const [islandsOpen, setIslandsOpen] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef({ guide: 0, stamps: 0, activities: 0 });

  return (
    <View style={styles.frame}>
      <BeaconBackground />
      <ScrollView ref={scrollRef} style={[scrollPort, { marginBottom: dockClearance(insets.bottom) }]} contentContainerStyle={[{ paddingBottom: 28 }, notchPadding("top", 16, insets.top)]}>
        <View style={styles.cover}>
          <Image source={{ uri: reels.venues.poster }} style={styles.coverPhoto} resizeMode="cover" accessibilityLabel="The island setting of TATEL" />
          <View style={styles.coverCopy}>
            <T variant="eyebrow" color={colors.gold}>Explore TATEL</T>
            <T variant="display">The islands are calling.</T>
            <View style={styles.hubLinks}>
              <Pressable accessibilityRole="button" onPress={() => router.push("/community")} style={styles.hubLink}><T variant="rowTitle" color={colors.gold}>Join the conversation</T></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push("/updates")} style={styles.hubLink}><T variant="rowTitle" color={colors.gold}>TATEL updates</T></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push("/program-overview")} style={styles.hubLink}><T variant="rowTitle" color={colors.gold}>See the four-day experience</T></Pressable>
              <Pressable accessibilityRole="button" onPress={() => scrollRef.current?.scrollTo({ y: offsets.current.activities, animated: false })} style={styles.hubLink}><T variant="rowTitle" color={colors.gold}>Find island activities</T></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push("/work")} style={styles.hubLink}><T variant="rowTitle" color={colors.gold}>My work notebook</T></Pressable>
            </View>
          </View>
        </View>
        <View onLayout={(event) => { offsets.current.guide = event.nativeEvent.layout.y; }}>
          <ExperienceGuide onStepChange={() => scrollRef.current?.scrollTo({ y: offsets.current.guide, animated: false })} onActivities={() => scrollRef.current?.scrollTo({ y: offsets.current.activities, animated: true })} onStamps={() => scrollRef.current?.scrollTo({ y: offsets.current.stamps, animated: true })} />
        </View>
        <IslandStory />
        <View style={styles.intro}>
          <T variant="title">Tell someone about TATEL.</T>
          <T variant="small">Good company makes the adventure. Invite someone along.</T>
          <ShareInvitation />
        </View>
        <View style={styles.intro}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: islandsOpen }} onPress={() => setIslandsOpen(!islandsOpen)} style={styles.islandsToggle}>
            <T variant="rowTitle" color={colors.gold}>Meet the five islands {islandsOpen ? "−" : "+"}</T>
          </Pressable>
          {islandsOpen ? <>
            <T variant="small">{ISLANDS_LINE}</T>
            <T variant="small">{ISLANDS_NOTE}</T>
            <T variant="meta" color={colors.gold}>Open Routes for travel connections and the Preparation guide for advice before you arrive.</T>
          </> : <T variant="small">Get to know the U.S. and British Virgin Islands and how to move between them.</T>}
        </View>
        <View onLayout={(event) => { offsets.current.stamps = event.nativeEvent.layout.y; }}>
        <StampCard
          pillars={forum.pillars}
          onOpen={(id) => {
            if ((zoneReelIds as readonly string[]).includes(id)) openChapter(id as ReelId, { pathname: "/pillar/[id]", params: { id } });
          }}
        />
        </View>
        <View onLayout={(event) => { offsets.current.activities = event.nativeEvent.layout.y; }}><IslandTime /></View>
        <View style={styles.intro}><Disclosure label="More experiences & charter extras">
        {extras.map((item) => item.url ? <View key={item.id} style={styles.island}><T variant="rowTitle">{item.title}</T><T variant="small">{item.line}</T><BookingLink href={item.url} name={item.title} detail={item.line} label="Explore & book" /></View> : (
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
        </Disclosure></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, minHeight: 0, backgroundColor: "#071421" },
  intro: { marginHorizontal: 16, marginBottom: 12, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  island: { marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 6, borderRadius: 18, ...nightGlass },
  cover: { marginHorizontal: 16, marginBottom: 24, backgroundColor: "#091D2B", borderRadius: 8, overflow: "hidden" },
  coverPhoto: { width: "100%", height: 240 },
  coverCopy: { padding: 22, gap: 16 },
  hubLinks: { marginTop: 4 },
  hubLink: { minHeight: 48, paddingVertical: 10, justifyContent: "center", borderTopWidth: 1, borderColor: colors.inkSoft },
  islandsToggle: { minHeight: 44, justifyContent: "center" },
  pill: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
