import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PassCheckout } from "@/components/PassCheckout";
import { QrMark } from "@/components/QrMark";
import { T } from "@/components/Text";
import { useAuth } from "@/community/auth";
import { useContent } from "@/content/provider";
import { readContactPrefs } from "@/logic/contactPrefs";
import { notePassPurchased, readIntake } from "@/logic/intake";
import { readOwnedPass, writeOwnedPass } from "@/logic/ownedPass";
import { CHECKOUT_SOON, canEmbedCheckout, passOffer, passTier, type PassTier } from "@/logic/passPay";
import { passPayload } from "@/logic/state";
import { useApp } from "@/store";
import { webStorage } from "@/welcome";
import { VipStart } from "@/components/VipStart";
import { colors, sceneForIsland } from "@/theme";
import { dockClearance } from "@/components/Dock";
import { nightGlass } from "@/components/nightGlass";

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

function readHold(): { owned: boolean; tier: PassTier | null } {
  const owned = readIntake(webStorage())?.hasPass === "have";
  return { owned, tier: owned ? readOwnedPass(webStorage()) : null };
}

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useContent();
  const { email, userId } = useAuth();
  const { state } = useApp();
  const params = useLocalSearchParams<{ checkout?: string; tier?: string; session_id?: string }>();
  const { passes } = program;
  const [passId, setPassId] = useState(() => readHold().tier ?? passes.items[0]?.id ?? "");
  const [shown, setShown] = useState(false);
  const [more, setMore] = useState(false);
  const [hold, setHold] = useState(readHold);
  const [paying, setPaying] = useState<PassTier | null>(() => {
    if (typeof window === "undefined") return null;
    const search = new URLSearchParams(window.location.search);
    if (search.get("checkout") !== "preview" || search.get("tier") === "vip") return null;
    return passTier(search.get("tier"));
  });
  const [starting, setStarting] = useState(() => {
    if (typeof window === "undefined") return false;
    const search = new URLSearchParams(window.location.search);
    return search.get("checkout") === "preview" && search.get("tier") === "vip";
  });
  const [booked, setBooked] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const pass = passes.items.find((item) => item.id === passId) ?? passes.items[0];

  const checkoutQuery = readCheckoutQuery(params);
  const refreshHold = useCallback(() => setHold(readHold()), []);

  useFocusEffect(useCallback(() => {
    refreshHold();
  }, [refreshHold]));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    if (search.get("checkout") !== "preview") return;
    if (search.get("tier") === "vip") {
      setStarting(true);
      return;
    }
    const tier = passTier(search.get("tier"));
    if (tier) setPaying(tier);
  }, []);

  useEffect(() => {
    if (!booked) return;
    notePassPurchased(webStorage());
    refreshHold();
  }, [booked, refreshHold]);

  useEffect(() => {
    if (checkoutQuery.checkout !== "return" || !checkoutQuery.sessionId) return;
    let live = true;
    fetch(`/api/checkout/status?session_id=${encodeURIComponent(checkoutQuery.sessionId)}`)
      .then((response) => response.json())
      .then((body: { status?: string; tier?: string | null }) => {
        if (!live) return;
        if (body.status === "complete") {
          const tier = passTier(body.tier);
          if (tier) writeOwnedPass(webStorage(), tier);
          setBooked(true);
        } else setCancelled(true);
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
    if (tier === "vip") {
      setStarting(true);
      return;
    }
    setPassId(id);
    setCancelled(false);
    setPaying(tier);
  }

  function claim(id: string) {
    const tier = passTier(id);
    if (!tier) return;
    writeOwnedPass(webStorage(), tier);
    setPassId(id);
    setMore(false);
    refreshHold();
  }

  if (!pass) return null;
  const payingPass = passes.items.find((item) => item.id === paying);
  const heldPass = hold.owned
    ? (passes.items.find((item) => item.id === (hold.tier ?? passId)) ?? pass)
    : null;

  return (
    <View style={styles.frame}>
      <Image source={{ uri: sceneForIsland("Jost Van Dyke") }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <ScrollView style={{ marginBottom: dockClearance(insets.bottom) }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
        <View style={styles.intro}>
          <T variant="eyebrow" color={colors.gold}>Tickets</T>
          <T variant="title" color={colors.foam}>{hold.owned ? "Your pass" : "Choose a pass"}</T>
          <T variant="small" color={colors.foam}>
            {hold.owned
              ? "Show it at the sessions. Beach, boat, and a VIP group are here if you need another."
              : "Beach, boat, or a VIP group. Eight shares fill a boat."}
          </T>
        </View>
        {heldPass ? (
          <View style={styles.hero}>
            <T variant="rowTitle" color={colors.foam}>{heldPass.name}</T>
            <T variant="small" color={colors.foam}>{heldPass.price} {heldPass.unit}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={shown ? "Hide pass" : "Show pass"}
              onPress={() => setShown((open) => !open)}
              style={styles.pill}
            >
              <T variant="button" color={colors.ink}>{shown ? "Hide pass" : "Show pass"}</T>
            </Pressable>
          </View>
        ) : null}
        {heldPass && shown ? (
          <View style={styles.qr}>
            <QrMark value={passPayload(heldPass.id)} />
            <T variant="meta" color={colors.foam}>Your pass on this device.</T>
          </View>
        ) : null}
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
                accessibilityLabel={checkoutReady ? (item.id === "vip" ? "Start a VIP group booking" : `Pay for ${item.name}`) : `${CHECKOUT_SOON}, ${item.name}`}
                disabled={!checkoutReady}
                onPress={() => buy(item.id)}
                style={styles.passCard}
              >
                {item.id === "vip" ? (
                  <>
                    <T variant="rowTitle" color={colors.foam}>STAY onboard</T>
                    <T variant="rowTitle" color={colors.foam}>All-inclusive VIP</T>
                  </>
                ) : <T variant="rowTitle" color={colors.foam}>{item.name}</T>}
                <T variant="small" color={colors.foam}>{item.id === "vip" ? `${offer.guests} · ${offer.total}` : `${item.price} ${item.unit}`}</T>
                {item.id === "vip" ? <T variant="meta" color={colors.gold}>$5,000 a share. A full boat is 8 shares.</T> : null}
                <View style={[styles.pill, !checkoutReady && styles.pillOff]}>
                  <T variant="button" color={colors.ink}>{checkoutReady ? (item.id === "vip" ? "Start a group booking" : "Pay") : CHECKOUT_SOON}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picks}>
          {passes.items.map((item) => {
            const current = item.id === pass.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={hold.owned && !hold.tier ? `This is my ${item.name} pass` : item.name}
                onPress={() => {
                  if (hold.owned && !hold.tier) claim(item.id);
                  else {
                    setPassId(item.id);
                    setMore(false);
                  }
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
      {paying && payingPass && paying !== "vip" ? (
        <PassCheckout
          tier={paying}
          title={payingPass.name}
          detail={`${payingPass.price} ${payingPass.unit}`}
          email={email}
          preview={checkoutQuery.checkout === "preview"}
          onClose={() => setPaying(null)}
          onBooked={() => {
            writeOwnedPass(webStorage(), paying);
            setPaying(null);
            setBooked(true);
          }}
        />
      ) : null}
      {starting ? (
        <VipStart
          email={email}
          name={state.profile.name}
          phone={readContactPrefs(webStorage())?.phone ?? null}
          userId={userId}
          onClose={() => setStarting(false)}
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
  intro: { marginHorizontal: 16, padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  passes: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  passCard: { padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  hero: { marginHorizontal: 16, marginTop: 16, padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
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
