import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrMark } from "@/components/QrMark";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { islandStamp, prefersReducedMotion, readStamps } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { passPayload } from "@/logic/state";
import { colors, sceneForIsland } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

const ways = ["Visit an island", "Open a session", "Finish a step on For you"];

export default function PassportScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { openChapter } = useReels();
  const { passes } = program;
  const [passId, setPassId] = useState(passes.items[0]?.id ?? "");
  const [shown, setShown] = useState(false);
  const [more, setMore] = useState(false);
  const pass = passes.items.find((item) => item.id === passId) ?? passes.items[0];
  const stamps = new Set(readStamps(localReelStore()));
  const reduced = prefersReducedMotion();
  const islands = program.forum.pillars;
  const held = islands.filter((pillar) => stamps.has(islandStamp(pillar.id))).length;

  if (!pass) return null;

  return (
    <View style={styles.frame}>
      <Image source={{ uri: sceneForIsland("Jost Van Dyke") }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }}>
        <View style={styles.book}>
          <T variant="eyebrow" color={colors.gold}>Your passport</T>
          <T variant="small" color={colors.foam}>Collect a stamp on each island and at each session you attend. Fill your passport during the summit.</T>
          <T variant="title" color={colors.foam}>{held} of {islands.length} islands</T>
          <T variant="eyebrow" color={colors.gold}>How to earn stamps</T>
          {ways.map((way) => (
            <T key={way} variant="small" color={colors.foam}>{way}</T>
          ))}
          <View style={styles.stamps}>
            {islands.map((pillar) => {
              const heldStamp = stamps.has(islandStamp(pillar.id));
              const zoneId = (zoneReelIds as readonly string[]).includes(pillar.id) ? (pillar.id as ReelId) : null;
              return (
                <Pressable
                  key={pillar.id}
                  accessibilityRole="button"
                  accessibilityLabel={heldStamp ? `${pillar.island} stamped` : `Open ${pillar.island}`}
                  onPress={() => {
                    if (zoneId) openChapter(zoneId, { pathname: "/pillar/[id]", params: { id: pillar.id } });
                  }}
                  style={styles.slot}
                >
                  <View style={[styles.stamp, heldStamp && styles.stampOn, heldStamp && !reduced && styles.stampIn]}>
                    <T variant="meta" color={heldStamp ? colors.ink : colors.gold}>{heldStamp ? "✓" : ""}</T>
                  </View>
                  <T variant="small" color={colors.foam} numberOfLines={2} style={styles.island}>{pillar.island}</T>
                  <T variant="meta" color={colors.gold} numberOfLines={2} style={styles.track}>{pillar.name}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.hero}>
          <T variant="eyebrow" color={colors.gold}>Event pass</T>
          <T variant="title" color={colors.foam}>{pass.name}</T>
          <T variant="small" color={colors.foam}>{pass.price} {pass.unit}</T>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? "Hide pass" : "Show pass"}
            onPress={() => setShown((open) => !open)}
            style={styles.pill}
          >
            <T variant="button" color={colors.ink}>{shown ? "Hide pass" : "Show pass"}</T>
          </Pressable>
        </View>
        {shown ? (
          <View style={styles.qr}>
            <QrMark value={passPayload(pass.id)} />
            <T variant="meta" color={colors.foam}>A design preview. No payment, and no seat reserved.</T>
          </View>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picks}>
          {passes.items.map((item) => {
            const current = item.id === pass.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                onPress={() => {
                  setPassId(item.id);
                  setMore(false);
                }}
                style={[styles.pick, current && styles.pickOn]}
              >
                <T variant="meta" color={colors.foam}>{item.name}</T>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="More about this pass" onPress={() => setMore((open) => !open)} style={styles.more}>
          <T variant="button" color={colors.ink}>{more ? "Hide" : "More"}</T>
        </Pressable>
        {more ? (
          <View style={styles.detail}>
            {pass.minimum ? <T variant="meta">{pass.minimum}</T> : null}
            {pass.paragraphs.map((paragraph) => (
              <T key={paragraph} variant="meta">{paragraph}</T>
            ))}
            {pass.bullets.map((bullet) => (
              <T key={bullet} variant="meta">{bullet}</T>
            ))}
            <T variant="meta">{passes.legend}</T>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  book: { marginHorizontal: 16, padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  stamps: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  slot: { width: "47%", minHeight: 132, alignItems: "center", gap: 6, paddingVertical: 8 },
  stamp: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255,224,138,0.7)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,27,42,0.28)",
  },
  stampOn: { backgroundColor: colors.gold, borderStyle: "solid", borderColor: colors.gold },
  stampIn: { ...({ animation: "tatel-stamp 420ms ease" } as object) },
  island: { textAlign: "center" },
  track: { textAlign: "center", fontSize: 13, lineHeight: 16 },
  hero: { marginHorizontal: 20, marginTop: 22, gap: 8 },
  pill: { alignSelf: "flex-start", minHeight: 48, marginTop: 8, paddingHorizontal: 20, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  qr: { alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 18, ...nightGlass },
  picks: { paddingHorizontal: 16, gap: 8, paddingTop: 16 },
  pick: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,224,138,0.28)", ...nightGlass },
  pickOn: { borderColor: colors.gold },
  more: { alignSelf: "flex-start", minHeight: 44, marginLeft: 20, marginTop: 16, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  detail: { marginHorizontal: 16, marginTop: 10, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
});
