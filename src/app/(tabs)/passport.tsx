import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PassCheckout } from "@/components/PassCheckout";
import { QrMark } from "@/components/QrMark";
import { T } from "@/components/Text";
import { useAuth } from "@/community/auth";
import { useContent } from "@/content/provider";
import { zoneReelIds, type ReelId } from "@/content/reels";
import { islandStamp, prefersReducedMotion, readStamps } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { useReels } from "@/reels/ReelHost";
import { notePassPurchased } from "@/logic/intake";
import { CHECKOUT_SOON, canEmbedCheckout, passOffer, passTier, type PassTier } from "@/logic/passPay";
import { webStorage } from "@/welcome";
import { passPayload } from "@/logic/state";
import { colors, sceneForIsland } from "@/theme";
import { dockClearance } from "@/components/Dock";
import { nightGlass } from "@/components/nightGlass";

const ways = ["Visit an island", "Open a session", "Finish a step on For you"];

function readCheckoutQuery(params: { checkout?: string | string[]; tier?: string | string[]; session_id?: string | string[] }) {
  const fromRouter = (value: string | string[] | undefined) => (typeof value === "string" ? value : null);
  if (typeof window === "undefined") {
    return { checkout: fromRouter(params.checkout), tier: fromRouter(params.tier), sessionId: fromRouter(params.session_id) };
  }
  const search = new URLSearchParams(window.location.search);
  return {
    checkout: search.get("checkout") ?? fromRouter(params.checkout),
    tier: search.get("tier") ?? fromRouter(params.tier),
    sessionId: search.get("session_id") ?? fromRouter(params.session_id),
  };
}

export default function PassportScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { openChapter } = useReels();
  const { email } = useAuth();
  const params = useLocalSearchParams<{ checkout?: string; tier?: string; session_id?: string }>();
  const { passes } = program;
  const [passId, setPassId] = useState(passes.items[0]?.id ?? "");
  const [shown, setShown] = useState(false);
  const [more, setMore] = useState(false);
  const [paying, setPaying] = useState<PassTier | null>(() => {
    if (typeof window === "undefined") return null;
    const search = new URLSearchParams(window.location.search);
    return search.get("checkout") === "preview" ? passTier(search.get("tier")) : null;
  });
  const [booked, setBooked] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const pass = passes.items.find((item) => item.id === passId) ?? passes.items[0];
  const stamps = new Set(readStamps(localReelStore()));
  const reduced = prefersReducedMotion();
  const islands = program.forum.pillars;
  const held = islands.filter((pillar) => stamps.has(islandStamp(pillar.id))).length;

  const checkoutQuery = readCheckoutQuery(params);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    if (search.get("checkout") !== "preview") return;
    const tier = passTier(search.get("tier"));
    if (tier) setPaying(tier);
  }, []);

  useEffect(() => {
    if (!booked) return;
    notePassPurchased(webStorage());
  }, [booked]);

  useEffect(() => {
    if (checkoutQuery.checkout !== "return" || !checkoutQuery.sessionId) return;
    let live = true;
    fetch(`/api/checkout/status?session_id=${encodeURIComponent(checkoutQuery.sessionId)}`)
      .then((response) => response.json())
      .then((body: { status?: string }) => {
        if (!live) return;
        if (body.status === "complete") setBooked(true);
        else setCancelled(true);
      })
      .catch(() => {
        if (live) setCancelled(true);
      });
    return () => {
      live = false;
    };
  }, [checkoutQuery.checkout, checkoutQuery.sessionId]);

  const checkoutReady = canEmbedCheckout();

  function buy(id: string) {
    const tier = passTier(id);
    if (!tier || !checkoutReady) return;
    setPassId(id);
    setCancelled(false);
    setPaying(tier);
  }

  if (!pass) return null;
  const payingPass = passes.items.find((item) => item.id === paying);

  return (
    <View style={styles.frame}>
      <Image source={{ uri: sceneForIsland("Jost Van Dyke") }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <ScrollView style={{ marginBottom: dockClearance(insets.bottom) }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
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
        <View style={styles.passes}>
          <T variant="eyebrow" color={colors.gold}>Passes</T>
          <T variant="small" color={colors.foam}>{passes.legend}</T>
          {passes.items.map((item) => {
            const offer = passOffer(item.id, item.price);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ disabled: !checkoutReady }}
                accessibilityLabel={checkoutReady ? `Pay for ${item.name}` : `${CHECKOUT_SOON}, ${item.name}`}
                disabled={!checkoutReady}
                onPress={() => buy(item.id)}
                style={styles.passCard}
              >
                <T variant="rowTitle" color={colors.foam}>{item.name}</T>
                <T variant="small" color={colors.foam}>{item.id === "vip" ? `${offer.guests} · ${offer.total}` : `${item.price} ${item.unit}`}</T>
                {item.id === "vip" ? <T variant="meta" color={colors.gold}>$5,000 per guest. Quantity is fixed at 8.</T> : null}
                <View style={[styles.pill, !checkoutReady && styles.pillOff]}>
                  <T variant="button" color={colors.ink}>{checkoutReady ? "Pay" : CHECKOUT_SOON}</T>
                </View>
              </Pressable>
            );
          })}
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
            <T variant="meta" color={colors.foam}>A code for the stamps on this device.</T>
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
      {paying && payingPass ? (
        <PassCheckout
          tier={paying}
          title={payingPass.name}
          detail={paying === "vip" ? "8 guests · $40,000 total" : `${payingPass.price} ${payingPass.unit}`}
          email={email}
          preview={checkoutQuery.checkout === "preview"}
          onClose={() => setPaying(null)}
          onBooked={() => {
            setPaying(null);
            setBooked(true);
          }}
        />
      ) : null}
      {booked ? (
        <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="You're booked">
          <View style={styles.notice}>
            <T variant="eyebrow" color={colors.gold}>Passes</T>
            <T variant="title" color={colors.foam}>You're booked</T>
            <T variant="small" color={colors.foam}>Your payment is complete. We'll see you at the sessions.</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Close booking" onPress={() => setBooked(false)} style={styles.pill}>
              <T variant="button" color={colors.ink}>Done</T>
            </Pressable>
          </View>
        </View>
      ) : null}
      {cancelled ? (
        <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="Payment not completed">
          <View style={styles.notice}>
            <T variant="eyebrow" color={colors.gold}>Passes</T>
            <T variant="title" color={colors.foam}>Payment not completed</T>
            <T variant="small" color={colors.foam}>No charge was finished. You can choose a pass and try again.</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Close payment message" onPress={() => setCancelled(false)} style={styles.pill}>
              <T variant="button" color={colors.ink}>Close</T>
            </Pressable>
          </View>
        </View>
      ) : null}
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
  passes: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  passCard: { padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  hero: { marginHorizontal: 20, marginTop: 22, gap: 8 },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 70, backgroundColor: "#071421", justifyContent: "center", padding: 16 },
  notice: { padding: 18, gap: 12, borderRadius: 22, ...nightGlass, backgroundColor: "rgba(7,27,42,0.92)" },
  pill: { alignSelf: "flex-start", minHeight: 48, marginTop: 8, paddingHorizontal: 20, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  pillOff: { opacity: 0.55 },
  qr: { alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 18, ...nightGlass },
  picks: { paddingHorizontal: 16, gap: 8, paddingTop: 16 },
  pick: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,224,138,0.28)", ...nightGlass },
  pickOn: { borderColor: colors.gold },
  more: { alignSelf: "flex-start", minHeight: 44, marginLeft: 20, marginTop: 16, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  detail: { marginHorizontal: 16, marginTop: 10, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
});
