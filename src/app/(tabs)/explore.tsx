import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRef, useState, type ComponentRef } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StampCard } from "@/components/StampCard";
import { ExperienceGuide } from "@/components/ExperienceGuide";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { AREA_COPY, ISLANDS_LINE, ISLANDS_NOTE } from "@/logic/tatelStory";
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
import { ShareInvitation } from "@/components/ShareInvitation";

const extras = [
  { id: "vip", title: "Five days aboard", line: "Wake up on the water with Be on Board. Explore the overnight charter and start a booking for your group, or ask to share.", href: "/tickets?tier=vip" },
  { id: "show", title: "Your red-carpet moment", line: "Dress for the occasion and discover island filmmaking at the red-carpet screening. Find the session, save it, and check its latest time and location.", href: "/session/ENT-SCREENING-D3" },
  { id: "dinner", title: "Good food, great company", line: "Be on Board includes curated lunches and dinners. The team will confirm the dining plans for your charter.", href: "/tickets?tier=vip" },
  { id: "water", title: "More time on the water", line: "Explore trips and watersports with Cruz Bay Watersports on St. John. Check availability and book directly with the operator.", url: "https://bestofusvi.com/usvi-charters/boat/cruz-bay-watersports-usvi/" },
  { id: "intro", title: "See the islands with a local", line: "Ask the Be on Board team about local guides and island experiences when you arrange your charter.", href: "/tickets?tier=vip" },
];

const islandIdeas = [
  { title: "Trade your shoes for the shoreline", line: "Let a good session become a long walk, a swim, or a slow afternoon by the sea. Find a beach on St. Thomas or St. John that fits the day you want to have.", url: "https://www.visitusvi.com/explore/beaches/", label: "Explore USVI beaches" },
  { title: "Get out on the water", line: "Snorkeling, paddling, or a boat outing can turn your free time into a highlight. Find local operators and check conditions, availability, and costs with them.", url: "https://www.visitusvi.com/explore/water-activities/", label: "Find water activities" },
  { title: "Taste, wander, discover", line: "Explore local food, culture, shopping, and island sights. Leave room for the unexpected conversation or the place you want to linger.", url: "https://www.visitusvi.com/explore/things-to-do/", label: "Explore USVI things to do" },
  { title: "Discover the islands around Tortola", line: "Get to know this part of the British Virgin Islands. TATEL's Entertainment venue near Tortola and its landing point are being confirmed; plan independent outings around your confirmed transport.", url: "https://www.bvitourism.com/", label: "Explore the British Virgin Islands" },
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
            <T variant="eyebrow" color={colors.gold}>Beyond the extraordinary conversations</T>
            <T variant="display">Let the islands tempt you.</T>
            <T variant="small">A morning that moves an idea forward. An afternoon in blue water. An evening worth dressing up for. Make room for every side of TATEL.</T>
            <T variant="meta" color={colors.gold}>Five island stops. Countless ways to make it yours.</T>
          </View>
        </View>
        <View onLayout={(event) => { offsets.current.guide = event.nativeEvent.layout.y; }}>
          <ExperienceGuide onStepChange={() => scrollRef.current?.scrollTo({ y: offsets.current.guide, animated: false })} onActivities={() => scrollRef.current?.scrollTo({ y: offsets.current.activities, animated: true })} onStamps={() => scrollRef.current?.scrollTo({ y: offsets.current.stamps, animated: true })} />
        </View>
        <IslandStory />
        <View style={styles.intro}>
          <T variant="title">Tell someone about TATEL.</T>
          <T variant="small">A Technology Mill in the Virgin Islands. Four days to identify a need, build and test an answer, and carry it forward—with extraordinary company along the way.</T>
          <ShareInvitation />
          <Pressable accessibilityRole="button" onPress={() => router.push("/program-overview")} style={styles.islandsToggle}><T variant="button" color={colors.gold}>See the four-day experience</T></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/updates")} style={styles.islandsToggle}><T variant="button" color={colors.gold}>TATEL updates</T></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/work")} style={styles.islandsToggle}><T variant="button" color={colors.gold}>My work notebook</T></Pressable>
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
        <View style={styles.kickerWrap}>
          <T variant="eyebrow" color={colors.gold}>Island by island</T>
        </View>
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
              <Image source={{ uri: reels[pillar.id as ReelId]?.poster }} style={styles.islandPhoto} resizeMode="cover" />
              <T variant="meta" color={colors.gold}>{pillar.region === "BVI" ? "British Virgin Islands" : "U.S. Virgin Islands"} · {pillar.island}</T>
              <T variant="rowTitle" color={colors.foam}>{pillar.name}</T>
              {copy ? <T variant="small" color={colors.gold}>{copy.headline}</T> : null}
              {copy ? <T variant="small" color={colors.foam}>{copy.body}</T> : null}
              <View style={styles.pill}><T variant="button" color={colors.ink}>Open this island</T></View>
            </Pressable>
          );
        })}
        <View onLayout={(event) => { offsets.current.activities = event.nativeEvent.layout.y; }} style={styles.intro}>
          <T variant="eyebrow" color={colors.gold}>Beyond the sessions</T>
          <T variant="title">Make room for island time</T>
          <T variant="small">Follow a great session with a little adventure. Find your beach, get out on the water, or discover a local favorite with these official visitor guides.</T>
          <T variant="meta">Choose and book independent outings separately; they may cost extra and are not automatically included in your TATEL ticket.</T>
        </View>
        {islandIdeas.map((idea) => <View key={idea.title} style={styles.island}><T variant="rowTitle" color={colors.gold}>{idea.title}</T><T variant="small">{idea.line}</T><ExternalLink href={idea.url} label={idea.label}>{idea.label}</ExternalLink></View>)}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, minHeight: 0, backgroundColor: "#071421" },
  intro: { marginHorizontal: 16, marginBottom: 12, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  kickerWrap: { alignSelf: "flex-start", marginLeft: 16, marginBottom: 8, marginTop: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, ...nightGlass },
  island: { marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 6, borderRadius: 18, ...nightGlass },
  cover: { marginHorizontal: 16, marginBottom: 24, backgroundColor: "#091D2B", borderRadius: 8, overflow: "hidden" },
  coverPhoto: { width: "100%", height: 240 },
  coverCopy: { padding: 22, gap: 16 },
  islandsToggle: { minHeight: 44, justifyContent: "center" },
  islandPhoto: { width: "100%", height: 170, borderRadius: 6, marginBottom: 10 },
  pill: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
