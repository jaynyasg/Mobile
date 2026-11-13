import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrMark } from "@/components/QrMark";
import { T } from "@/components/Text";
import { useContent } from "@/content/provider";
import { islandStamp, prefersReducedMotion, questsForProgram, readStamps } from "@/guide/stamps";
import { suggestedDayId } from "@/logic/phase";
import { localReelStore } from "@/reels/gate";
import { passPayload } from "@/logic/state";
import { colors, sceneForIsland } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function PassportScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { passes } = program;
  const [passId, setPassId] = useState(passes.items[0]?.id ?? "");
  const [shown, setShown] = useState(false);
  const [more, setMore] = useState(false);
  const pass = passes.items.find((item) => item.id === passId) ?? passes.items[0];
  const stamps = new Set(readStamps(localReelStore()));
  const reduced = prefersReducedMotion();
  const dayId = suggestedDayId(new Date());
  const quests = questsForProgram({
    dayId,
    sessions: program.sessions,
    modes: program.transport.modes,
    weekAgenda: program.forum.weekAgenda,
  });
  const islands = program.forum.pillars;
  const held = islands.filter((pillar) => stamps.has(islandStamp(pillar.id))).length;

  if (!pass) return null;

  return (
    <View style={styles.frame}>
      <Image source={{ uri: sceneForIsland("Jost Van Dyke") }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 120 }}>
        <View style={styles.hero}>
          <T variant="eyebrow" color={colors.gold}>{passes.previewLabel}</T>
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
        <View style={styles.book}>
          <T variant="eyebrow" color={colors.gold}>Island passport</T>
          <T variant="small" color={colors.foam}>{held} of {islands.length} islands</T>
          <View style={styles.stamps}>
            {islands.map((pillar) => {
              const heldStamp = stamps.has(islandStamp(pillar.id));
              return (
                <View key={pillar.id} style={styles.stampWrap}>
                  <View style={[styles.stamp, heldStamp && styles.stampOn, heldStamp && !reduced && styles.stampIn]}>
                    <T variant="meta" color={heldStamp ? colors.ink : colors.gold}>{pillar.name.slice(0, 1)}</T>
                  </View>
                  <T variant="meta" color={colors.foam} numberOfLines={1}>{pillar.island.split(" ")[0]}</T>
                </View>
              );
            })}
          </View>
          <T variant="meta" color={colors.foam}>
            {stamps.size} marks · reels {program.forum.pillars.length ? [...stamps].filter((stamp) => stamp.startsWith("reel:")).length : 0} · notes {[...stamps].filter((stamp) => stamp.startsWith("know:")).length}
          </T>
          {quests.map((quest) => (
            <T key={quest.id} variant="small" color={stamps.has(quest.stamp) ? colors.gold : colors.foam}>
              {stamps.has(quest.stamp) ? "Stamped" : "Open"} · {quest.title}
            </T>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picks}>
          {passes.items.map((item) => {
            const on = item.id === pass.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setPassId(item.id);
                  setMore(false);
                }}
                style={[styles.pick, on && styles.pickOn]}
              >
                <T variant="meta" color={on ? colors.ink : colors.foam}>{item.name}</T>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => setMore((open) => !open)} style={styles.more}>
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
  hero: { marginHorizontal: 20, marginTop: 180, gap: 8 },
  book: { marginHorizontal: 16, marginTop: 18, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  stamps: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  stampWrap: { alignItems: "center", width: 58, gap: 4 },
  stamp: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,224,138,0.45)", alignItems: "center", justifyContent: "center" },
  stampOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  stampIn: { ...({ animation: "tatel-stamp 420ms ease" } as object) },
  pill: { alignSelf: "flex-start", minHeight: 48, marginTop: 8, paddingHorizontal: 20, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  qr: { alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 18, ...nightGlass },
  picks: { paddingHorizontal: 16, gap: 8, paddingTop: 16 },
  pick: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", ...nightGlass },
  pickOn: { backgroundColor: colors.gold },
  more: { alignSelf: "flex-start", minHeight: 44, marginLeft: 20, marginTop: 16, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  detail: { marginHorizontal: 16, marginTop: 10, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
});
